<?php
/**
 * Hostinger MySQL Database Configuration
 * 호스팅어 hPanel > Databases > MySQL Databases 에서 생성한 정보를 입력하세요.
 */

// 호스팅어 MySQL 데이터베이스 정보
define('DB_HOST', 'localhost');                  // 호스팅어 내부 접속은 항상 localhost
define('DB_PORT', '3306');                       // 기본 포트 3306
define('DB_NAME', 'u123456789_cfs');             // 호스팅어에서 생성한 데이터베이스 이름 (예: u123456789_cfs)
define('DB_USER', 'u123456789_user');            // 호스팅어에서 생성한 데이터베이스 사용자명
define('DB_PASS', 'your_password_here');         // 호스팅어 데이터베이스 비밀번호

// 관리자 마스터 비밀번호 (시스템 관리자 접근용)
define('ADMIN_PASSWORD', 'hepsiba1234');
