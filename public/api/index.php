<?php
/**
 * 교회 재정관리 시스템 (CFS) - Hostinger MySQL REST API
 * PHP 7.4 / 8.x + MySQL PDO
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// OPTIONS 사전 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 설정 파일 불러오기
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'config.php 파일을 찾을 수 없습니다.']);
    exit;
}
require_once $configFile;

// MySQL PDO 연결
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'MySQL 연결 실패: ' . $e->getMessage(),
        'hint' => 'api/config.php 파일의 DB_NAME, DB_USER, DB_PASS 설정값을 확인하세요.'
    ]);
    exit;
}

// 요청 데이터 파싱
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// /api 접두어 정규화
$path = preg_replace('#^.*?/api/#', '', $uri);
$path = trim($path, '/');
$segments = $path === '' ? [] : explode('/', $path);

$rawBody = file_get_contents('php://input');
$input = json_decode($rawBody, true) ?: [];

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function errorResponse($message, $status = 400) {
    jsonResponse(['error' => $message], $status);
}

// -------------------------------------------------------------
// 라우팅 (Routing)
// -------------------------------------------------------------

$resource = $segments[0] ?? '';
$resourceId = $segments[1] ?? null;

// 1. 헬스 체크 / 연결 확인: GET /api/health
if ($resource === 'health' && $method === 'GET') {
    jsonResponse([
        'status' => 'ok',
        'db' => 'connected',
        'time' => date('Y-m-d H:i:s')
    ]);
}

// 2. 관리자 비밀번호 검증: POST /api/admin/login
if ($resource === 'admin' && ($segments[1] ?? '') === 'login' && $method === 'POST') {
    $pass = $input['password'] ?? '';
    if ($pass === ADMIN_PASSWORD) {
        jsonResponse(['success' => true]);
    } else {
        errorResponse('관리자 비밀번호가 일치하지 않습니다.', 401);
    }
}

// 3. 교회 관련: /api/churches
if ($resource === 'churches') {
    // POST /api/churches/login : 교회 사용자 로그인
    if ($resourceId === 'login' && $method === 'POST') {
        $name = trim($input['name'] ?? '');
        $pass = $input['password'] ?? '';

        if (!$name || !$pass) {
            errorResponse('교회 이름과 비밀번호를 입력해 주세요.');
        }

        $stmt = $pdo->prepare("SELECT * FROM churches WHERE name = ? LIMIT 1");
        $stmt->execute([$name]);
        $church = $stmt->fetch();

        if (!$church || !password_verify($pass, $church['password'])) {
            errorResponse('교회 이름 또는 비밀번호가 일치하지 않습니다.', 401);
        }

        jsonResponse([
            'id' => (string)$church['id'],
            'name' => $church['name'],
            'createdAt' => $church['created_at']
        ]);
    }

    // GET /api/churches : 전체 교회 목록
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT id, name, created_at as createdAt FROM churches ORDER BY name ASC");
        $rows = $stmt->fetchAll();
        $churches = array_map(function($c) {
            return [
                'id' => (string)$c['id'],
                'name' => $c['name'],
                'createdAt' => $c['createdAt']
            ];
        }, $rows);
        jsonResponse($churches);
    }

    // POST /api/churches : 신규 교회 등록
    if ($method === 'POST' && !$resourceId) {
        $name = trim($input['name'] ?? '');
        $pass = $input['password'] ?? '';

        if (!$name || !$pass) {
            errorResponse('교회 이름과 비밀번호를 입력해 주세요.');
        }

        // 중복 체크
        $chk = $pdo->prepare("SELECT id FROM churches WHERE name = ?");
        $chk->execute([$name]);
        if ($chk->fetch()) {
            errorResponse('이미 존재하는 교회 이름입니다.');
        }

        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO churches (name, password) VALUES (?, ?)");
        $stmt->execute([$name, $hash]);
        $newId = $pdo->lastInsertId();

        jsonResponse([
            'id' => (string)$newId,
            'name' => $name,
            'createdAt' => date('Y-m-d H:i:s')
        ]);
    }

    // PUT /api/churches/{id} : 교회 정보 수정
    if ($method === 'PUT' && $resourceId) {
        $name = isset($input['name']) ? trim($input['name']) : null;
        $pass = isset($input['password']) && !empty($input['password']) ? $input['password'] : null;

        $updates = [];
        $params = [];

        if ($name) {
            $updates[] = "name = ?";
            $params[] = $name;
        }
        if ($pass) {
            $updates[] = "password = ?";
            $params[] = password_hash($pass, PASSWORD_BCRYPT);
        }

        if (empty($updates)) {
            errorResponse('수정할 내용이 없습니다.');
        }

        $params[] = (int)$resourceId;
        $sql = "UPDATE churches SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        jsonResponse(['success' => true]);
    }

    // DELETE /api/churches/{id} : 교회 삭제
    if ($method === 'DELETE' && $resourceId) {
        $stmt = $pdo->prepare("DELETE FROM churches WHERE id = ?");
        $stmt->execute([(int)$resourceId]);
        jsonResponse(['success' => true]);
    }
}

// 4. 교인 관리: /api/members
if ($resource === 'members') {
    // GET /api/members?churchId=1
    if ($method === 'GET') {
        $churchId = $_GET['churchId'] ?? null;
        if (!$churchId) errorResponse('churchId가 필요합니다.');

        $stmt = $pdo->prepare("SELECT id, name, phone, address, birth_date as birthDate, registration_date as registrationDate, created_at as createdAt FROM members WHERE church_id = ? ORDER BY name ASC");
        $stmt->execute([(int)$churchId]);
        $rows = $stmt->fetchAll();

        $members = array_map(function($m) {
            return [
                'id' => (string)$m['id'],
                'name' => $m['name'],
                'phone' => $m['phone'] ?? '',
                'address' => $m['address'] ?? '',
                'birthDate' => $m['birthDate'] ?? '',
                'registrationDate' => $m['registrationDate'] ?? '',
                'createdAt' => $m['createdAt']
            ];
        }, $rows);

        jsonResponse($members);
    }

    // POST /api/members : 교인 등록
    if ($method === 'POST') {
        $churchId = $input['churchId'] ?? null;
        $name = trim($input['name'] ?? '');
        if (!$churchId || !$name) errorResponse('churchId와 이름을 입력해 주세요.');

        $stmt = $pdo->prepare("INSERT INTO members (church_id, name, phone, address, birth_date, registration_date) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            (int)$churchId,
            $name,
            $input['phone'] ?? '',
            $input['address'] ?? '',
            $input['birthDate'] ?? '',
            $input['registrationDate'] ?? date('Y-m-d')
        ]);

        jsonResponse(['id' => (string)$pdo->lastInsertId(), 'success' => true]);
    }

    // PUT /api/members/{id} : 교인 정보 수정
    if ($method === 'PUT' && $resourceId) {
        $fields = ['name', 'phone', 'address', 'birthDate', 'registrationDate'];
        $updates = [];
        $params = [];

        foreach ($fields as $field) {
            if (isset($input[$field])) {
                $dbCol = $field === 'birthDate' ? 'birth_date' : ($field === 'registrationDate' ? 'registration_date' : $field);
                $updates[] = "`$dbCol` = ?";
                $params[] = $input[$field];
            }
        }

        if (empty($updates)) errorResponse('수정할 데이터가 없습니다.');
        $params[] = (int)$resourceId;

        $stmt = $pdo->prepare("UPDATE members SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);

        jsonResponse(['success' => true]);
    }

    // DELETE /api/members/{id} : 교인 삭제
    if ($method === 'DELETE' && $resourceId) {
        $stmt = $pdo->prepare("DELETE FROM members WHERE id = ?");
        $stmt->execute([(int)$resourceId]);
        jsonResponse(['success' => true]);
    }
}

// 5. 헌금 관리: /api/offerings
if ($resource === 'offerings') {
    // GET /api/offerings?churchId=1
    if ($method === 'GET') {
        $churchId = $_GET['churchId'] ?? null;
        if (!$churchId) errorResponse('churchId가 필요합니다.');

        $sql = "SELECT o.id, o.church_id as churchId, o.member_id as memberId, o.type, o.amount, o.date, o.notes, o.created_at as createdAt, m.name as memberName 
                FROM offerings o 
                LEFT JOIN members m ON o.member_id = m.id 
                WHERE o.church_id = ? 
                ORDER BY o.date DESC, o.id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([(int)$churchId]);
        $rows = $stmt->fetchAll();

        $offerings = array_map(function($o) {
            return [
                'id' => (string)$o['id'],
                'churchId' => (string)$o['churchId'],
                'memberId' => $o['memberId'] ? (string)$o['memberId'] : '',
                'memberName' => $o['memberName'] ?: '미지정',
                'type' => $o['type'],
                'amount' => (float)$o['amount'],
                'date' => $o['date'],
                'notes' => $o['notes'] ?? '',
                'createdAt' => strtotime($o['createdAt']) * 1000
            ];
        }, $rows);

        jsonResponse($offerings);
    }

    // POST /api/offerings
    if ($method === 'POST') {
        $churchId = $input['churchId'] ?? null;
        $type = $input['type'] ?? '';
        $amount = (float)($input['amount'] ?? 0);
        $date = $input['date'] ?? date('Y-m-d');
        $memberId = !empty($input['memberId']) ? (int)$input['memberId'] : null;
        $notes = $input['notes'] ?? '';

        if (!$churchId || !$type) errorResponse('churchId와 헌금 종류는 필수입니다.');

        $stmt = $pdo->prepare("INSERT INTO offerings (church_id, member_id, type, amount, date, notes) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([(int)$churchId, $memberId, $type, $amount, $date, $notes]);

        jsonResponse(['id' => (string)$pdo->lastInsertId(), 'success' => true]);
    }

    // PUT /api/offerings/{id}
    if ($method === 'PUT' && $resourceId) {
        $fields = ['type', 'amount', 'date', 'notes', 'memberId'];
        $updates = [];
        $params = [];

        foreach ($fields as $field) {
            if (isset($input[$field])) {
                $dbCol = $field === 'memberId' ? 'member_id' : $field;
                $val = $input[$field];
                if ($field === 'memberId') $val = !empty($val) ? (int)$val : null;
                if ($field === 'amount') $val = (float)$val;
                $updates[] = "`$dbCol` = ?";
                $params[] = $val;
            }
        }

        if (empty($updates)) errorResponse('수정할 데이터가 없습니다.');
        $params[] = (int)$resourceId;

        $stmt = $pdo->prepare("UPDATE offerings SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);

        jsonResponse(['success' => true]);
    }

    // DELETE /api/offerings/{id}
    if ($method === 'DELETE' && $resourceId) {
        $stmt = $pdo->prepare("DELETE FROM offerings WHERE id = ?");
        $stmt->execute([(int)$resourceId]);
        jsonResponse(['success' => true]);
    }
}

// 6. 입출금 관리: /api/transactions
if ($resource === 'transactions') {
    // GET /api/transactions?churchId=1
    if ($method === 'GET') {
        $churchId = $_GET['churchId'] ?? null;
        if (!$churchId) errorResponse('churchId가 필요합니다.');

        $sql = "SELECT t.id, t.church_id as churchId, t.type, t.category, t.amount, t.date, t.description, t.member_id as memberId, t.created_at as createdAt, m.name as memberName 
                FROM transactions t 
                LEFT JOIN members m ON t.member_id = m.id 
                WHERE t.church_id = ? 
                ORDER BY t.date DESC, t.id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([(int)$churchId]);
        $rows = $stmt->fetchAll();

        $transactions = array_map(function($t) {
            return [
                'id' => (string)$t['id'],
                'churchId' => (string)$t['churchId'],
                'type' => $t['type'],
                'category' => $t['category'],
                'amount' => (float)$t['amount'],
                'date' => $t['date'],
                'description' => $t['description'] ?? '',
                'memberId' => $t['memberId'] ? (string)$t['memberId'] : undefined,
                'memberName' => $t['memberName'] ?: undefined,
                'createdAt' => strtotime($t['createdAt']) * 1000
            ];
        }, $rows);

        jsonResponse($transactions);
    }

    // POST /api/transactions
    if ($method === 'POST') {
        $churchId = $input['churchId'] ?? null;
        $type = $input['type'] ?? 'income';
        $category = $input['category'] ?? '';
        $amount = (float)($input['amount'] ?? 0);
        $date = $input['date'] ?? date('Y-m-d');
        $description = $input['description'] ?? '';
        $memberId = !empty($input['memberId']) ? (int)$input['memberId'] : null;

        if (!$churchId || !$category) errorResponse('churchId와 분류는 필수입니다.');

        $stmt = $pdo->prepare("INSERT INTO transactions (church_id, type, category, amount, date, description, member_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([(int)$churchId, $type, $category, $amount, $date, $description, $memberId]);

        jsonResponse(['id' => (string)$pdo->lastInsertId(), 'success' => true]);
    }

    // PUT /api/transactions/{id}
    if ($method === 'PUT' && $resourceId) {
        $fields = ['type', 'category', 'amount', 'date', 'description', 'memberId'];
        $updates = [];
        $params = [];

        foreach ($fields as $field) {
            if (isset($input[$field])) {
                $dbCol = $field === 'memberId' ? 'member_id' : $field;
                $val = $input[$field];
                if ($field === 'memberId') $val = !empty($val) ? (int)$val : null;
                if ($field === 'amount') $val = (float)$val;
                $updates[] = "`$dbCol` = ?";
                $params[] = $val;
            }
        }

        if (empty($updates)) errorResponse('수정할 데이터가 없습니다.');
        $params[] = (int)$resourceId;

        $stmt = $pdo->prepare("UPDATE transactions SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);

        jsonResponse(['success' => true]);
    }

    // DELETE /api/transactions/{id}
    if ($method === 'DELETE' && $resourceId) {
        $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ?");
        $stmt->execute([(int)$resourceId]);
        jsonResponse(['success' => true]);
    }
}

// 7. 데이터 백업 복원 (Bulk Restore): POST /api/restore
if ($resource === 'restore' && $method === 'POST') {
    $churchId = $input['churchId'] ?? null;
    $type = $input['type'] ?? '';
    $data = $input['data'] ?? [];

    if (!$churchId || !$type || !is_array($data)) {
        errorResponse('잘못된 복원 요청 데이터입니다.');
    }

    $pdo->beginTransaction();
    try {
        if ($type === 'members') {
            $stmt = $pdo->prepare("INSERT INTO members (church_id, name, phone, address, birth_date, registration_date) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data as $item) {
                $stmt->execute([
                    (int)$churchId,
                    $item['name'] ?? '',
                    $item['phone'] ?? '',
                    $item['address'] ?? '',
                    $item['birthDate'] ?? '',
                    $item['registrationDate'] ?? date('Y-m-d')
                ]);
            }
        } else if ($type === 'offerings') {
            $stmt = $pdo->prepare("INSERT INTO offerings (church_id, member_id, type, amount, date, notes) VALUES (?, ?, ?, ?, ?, ?)");
            foreach ($data as $item) {
                $stmt->execute([
                    (int)$churchId,
                    !empty($item['memberId']) ? (int)$item['memberId'] : null,
                    $item['type'] ?? '',
                    (float)($item['amount'] ?? 0),
                    $item['date'] ?? date('Y-m-d'),
                    $item['notes'] ?? ''
                ]);
            }
        } else if ($type === 'transactions') {
            $stmt = $pdo->prepare("INSERT INTO transactions (church_id, type, category, amount, date, description, member_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($data as $item) {
                $stmt->execute([
                    (int)$churchId,
                    $item['type'] ?? 'income',
                    $item['category'] ?? '',
                    (float)($item['amount'] ?? 0),
                    $item['date'] ?? date('Y-m-d'),
                    $item['description'] ?? '',
                    !empty($item['memberId']) ? (int)$item['memberId'] : null
                ]);
            }
        }
        $pdo->commit();
        jsonResponse(['success' => true, 'count' => count($data)]);
    } catch (Exception $e) {
        $pdo->rollBack();
        errorResponse('복원 중 오류 발생: ' . $e->getMessage(), 500);
    }
}

// 일치하는 라우트가 없을 때
errorResponse('유효하지 않은 API 경로입니다: ' . $uri, 404);
