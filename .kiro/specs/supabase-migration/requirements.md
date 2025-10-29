# Requirements Document

## Introduction

本文档定义了将培训管理系统从 LocalStorage 迁移到 Supabase + Netlify 架构的需求。该迁移旨在实现真正的多用户协作、数据持久化和实时同步功能，同时保持现有功能的完整性和用户体验。

## Glossary

- **System**: 培训管理系统（Training Management System）
- **Supabase**: 开源的 Firebase 替代品，提供 PostgreSQL 数据库、认证和实时订阅功能
- **Netlify**: 静态网站托管平台，提供 CI/CD 和全球 CDN
- **RLS**: Row Level Security，行级安全策略，用于数据访问控制
- **Migration**: 数据迁移过程，将现有数据结构转换为新的数据库架构
- **LocalStorage**: 浏览器本地存储，当前系统的数据存储方式
- **Real-time Sync**: 实时同步，多用户间的数据即时更新
- **RBAC**: Role-Based Access Control，基于角色的访问控制

## Requirements

### Requirement 1: 数据库架构设计

**User Story:** 作为系统架构师，我需要设计完整的数据库表结构，以便支持所有现有功能并确保数据完整性。

#### Acceptance Criteria

1. WHEN THE System initializes database schema, THE System SHALL create tables for users, customers, experts, salespersons, training_sessions, courses, and permissions with proper relationships
2. WHEN THE System defines table relationships, THE System SHALL implement foreign key constraints to maintain referential integrity between related entities
3. WHEN THE System configures RLS policies, THE System SHALL ensure admin users can access all data while salespersons can only access their own customer data
4. WHERE data migration is required, THE System SHALL provide SQL scripts to create all necessary tables with appropriate indexes
5. WHEN THE System stores user credentials, THE System SHALL use Supabase Auth for secure password hashing and token management

### Requirement 2: 认证系统迁移

**User Story:** 作为用户，我需要使用真实的认证系统登录，以便我的账户和数据得到安全保护。

#### Acceptance Criteria

1. WHEN a user attempts to login, THE System SHALL authenticate credentials through Supabase Auth instead of LocalStorage comparison
2. WHEN authentication succeeds, THE System SHALL retrieve user profile data including role and permissions from the database
3. WHEN THE System manages user sessions, THE System SHALL use JWT tokens provided by Supabase with automatic refresh
4. IF authentication fails, THEN THE System SHALL display appropriate error messages without exposing security details
5. WHEN a user logs out, THE System SHALL clear all session data and revoke authentication tokens

### Requirement 3: 数据服务层重构

**User Story:** 作为开发者，我需要重构 dataService 层，以便所有数据操作通过 Supabase API 而不是 LocalStorage。

#### Acceptance Criteria

1. WHEN THE System performs CRUD operations, THE System SHALL use Supabase client methods instead of LocalStorage APIs
2. WHEN THE System queries data, THE System SHALL apply RLS policies automatically based on the authenticated user's role
3. WHEN THE System handles errors, THE System SHALL catch and transform Supabase errors into user-friendly messages
4. WHEN THE System fetches related data, THE System SHALL use Supabase joins to minimize database queries
5. WHEN THE System updates data, THE System SHALL validate input data before sending to the database

### Requirement 4: 实时数据同步

**User Story:** 作为业务员，当其他用户修改数据时，我需要看到实时更新，以便我始终查看最新信息。

#### Acceptance Criteria

1. WHEN data changes in the database, THE System SHALL notify subscribed clients through Supabase real-time channels
2. WHEN THE System receives real-time updates, THE System SHALL update the UI without requiring page refresh
3. WHEN multiple users edit the same record, THE System SHALL handle conflicts using last-write-wins strategy
4. WHEN THE System establishes real-time connections, THE System SHALL automatically reconnect if the connection drops
5. WHERE real-time updates are not critical, THE System SHALL use polling as a fallback mechanism

### Requirement 5: 权限控制实现

**User Story:** 作为管理员，我需要精确控制不同角色的数据访问权限，以便保护敏感信息和维护数据安全。

#### Acceptance Criteria

1. WHEN THE System enforces permissions, THE System SHALL implement RLS policies at the database level for defense in depth
2. WHEN a salesperson queries customers, THE System SHALL return only customers assigned to that salesperson
3. WHEN an admin queries any data, THE System SHALL return all records without restrictions
4. WHEN an expert queries training sessions, THE System SHALL return only sessions where they are the assigned expert
5. IF a user attempts unauthorized access, THEN THE System SHALL deny the request and log the attempt

### Requirement 6: 数据迁移策略

**User Story:** 作为系统管理员，我需要安全地将现有测试数据迁移到 Supabase，以便在新系统中保留历史数据。

#### Acceptance Criteria

1. WHEN THE System migrates data, THE System SHALL export current LocalStorage data to JSON format
2. WHEN THE System imports data to Supabase, THE System SHALL validate data integrity before insertion
3. WHEN THE System encounters migration errors, THE System SHALL log errors and continue with remaining data
4. WHEN THE System completes migration, THE System SHALL verify record counts match between source and destination
5. WHERE data transformation is needed, THE System SHALL apply mapping rules to convert LocalStorage format to database schema

### Requirement 7: 环境配置管理

**User Story:** 作为开发者，我需要管理不同环境的配置，以便在开发、测试和生产环境中使用不同的 Supabase 实例。

#### Acceptance Criteria

1. WHEN THE System loads configuration, THE System SHALL read Supabase credentials from environment variables
2. WHEN THE System runs in development mode, THE System SHALL use development Supabase project credentials
3. WHEN THE System deploys to production, THE System SHALL use production Supabase project credentials
4. IF environment variables are missing, THEN THE System SHALL display clear error messages indicating which variables are required
5. WHEN THE System stores sensitive data, THE System SHALL never commit API keys or secrets to version control

### Requirement 8: 错误处理和回滚

**User Story:** 作为开发者，我需要完善的错误处理和回滚机制，以便在迁移过程中出现问题时能够安全恢复。

#### Acceptance Criteria

1. WHEN THE System encounters database errors, THE System SHALL display user-friendly error messages
2. WHEN THE System performs critical operations, THE System SHALL implement transaction support for atomicity
3. IF migration fails, THEN THE System SHALL provide rollback scripts to restore previous state
4. WHEN THE System logs errors, THE System SHALL include sufficient context for debugging
5. WHEN THE System detects data inconsistencies, THE System SHALL alert administrators and prevent further operations

### Requirement 9: 性能优化

**User Story:** 作为用户，我需要系统响应迅速，以便获得流畅的使用体验。

#### Acceptance Criteria

1. WHEN THE System loads initial data, THE System SHALL implement pagination to limit records per request
2. WHEN THE System queries frequently accessed data, THE System SHALL implement client-side caching with appropriate TTL
3. WHEN THE System performs complex queries, THE System SHALL use database indexes to optimize query performance
4. WHEN THE System renders large lists, THE System SHALL implement virtual scrolling to reduce DOM nodes
5. WHEN THE System fetches related data, THE System SHALL use batch requests to minimize network round trips

### Requirement 10: 部署和 CI/CD

**User Story:** 作为开发者，我需要自动化的部署流程，以便快速、可靠地发布新版本。

#### Acceptance Criteria

1. WHEN code is pushed to main branch, THE System SHALL automatically trigger Netlify build and deployment
2. WHEN THE System builds the application, THE System SHALL inject environment variables for Supabase configuration
3. WHEN THE System deploys to production, THE System SHALL run database migrations automatically
4. IF build fails, THEN THE System SHALL send notifications and prevent deployment
5. WHEN THE System completes deployment, THE System SHALL run smoke tests to verify basic functionality

### Requirement 11: 向后兼容性

**User Story:** 作为现有用户，我需要新系统保持与旧系统相同的界面和操作流程，以便无需重新学习。

#### Acceptance Criteria

1. WHEN THE System migrates to Supabase, THE System SHALL maintain all existing UI components without visual changes
2. WHEN THE System changes data layer, THE System SHALL preserve all existing API interfaces used by components
3. WHEN THE System updates authentication, THE System SHALL maintain the same login flow and user experience
4. WHEN THE System modifies data structures, THE System SHALL ensure all existing features continue to work
5. WHERE breaking changes are unavoidable, THE System SHALL document changes and provide migration guides

### Requirement 12: 测试和验证

**User Story:** 作为质量保证人员，我需要全面的测试覆盖，以便确保迁移后系统功能正常且数据准确。

#### Acceptance Criteria

1. WHEN THE System completes migration, THE System SHALL verify all CRUD operations work correctly for each entity
2. WHEN THE System tests permissions, THE System SHALL verify each role can only access authorized data
3. WHEN THE System tests real-time sync, THE System SHALL verify updates propagate to all connected clients
4. WHEN THE System performs load testing, THE System SHALL handle at least 100 concurrent users without degradation
5. WHEN THE System validates data integrity, THE System SHALL compare migrated data against source data for accuracy
