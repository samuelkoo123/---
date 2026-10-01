-- ========================================================
-- 교회 재정관리 시스템 (Church Finance System)
-- 호스팅어(Hostinger) MySQL 데이터베이스 생성 스크립트
-- ========================================================
-- 호스팅어 hPanel > Databases > phpMyAdmin에 접속한 후
-- 해당 데이터베이스를 선택하고 아래 SQL을 복사하여 실행(SQL 탭)하거나
-- '가져오기(Import)'를 통해 이 파일을 업로드하세요.
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 교회 정보 테이블
CREATE TABLE IF NOT EXISTS `churches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 교인 정보 테이블
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `church_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(30) DEFAULT '',
  `address` VARCHAR(255) DEFAULT '',
  `birth_date` VARCHAR(20) DEFAULT '',
  `registration_date` VARCHAR(20) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_members_church` (`church_id`),
  CONSTRAINT `fk_members_church` FOREIGN KEY (`church_id`) REFERENCES `churches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 헌금 내역 테이블
CREATE TABLE IF NOT EXISTS `offerings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `church_id` INT NOT NULL,
  `member_id` INT DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `date` VARCHAR(20) NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_offerings_church_date` (`church_id`, `date`),
  INDEX `idx_offerings_member` (`member_id`),
  CONSTRAINT `fk_offerings_church` FOREIGN KEY (`church_id`) REFERENCES `churches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offerings_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 입출금 내역 테이블
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `church_id` INT NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `date` VARCHAR(20) NOT NULL,
  `description` VARCHAR(255) DEFAULT '',
  `member_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_transactions_church_date` (`church_id`, `date`),
  INDEX `idx_transactions_member` (`member_id`),
  CONSTRAINT `fk_transactions_church` FOREIGN KEY (`church_id`) REFERENCES `churches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transactions_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
