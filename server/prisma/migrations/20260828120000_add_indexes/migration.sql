-- Add missing indexes for hot read paths
-- (No data changes; just CREATE INDEX which is non-blocking on MySQL 8+)

-- lead: lookup by WhatsApp on every order creation
CREATE INDEX `lead_whatsapp_idx` ON `lead`(`whatsapp`);
CREATE INDEX `lead_status_idx` ON `lead`(`status`);
CREATE INDEX `lead_deletedAt_idx` ON `lead`(`deletedAt`);

-- order: dashboard lists filter by status, sort by createdAt
CREATE INDEX `order_deletedAt_idx` ON `order`(`deletedAt`);
CREATE INDEX `order_createdAt_idx` ON `order`(`createdAt`);

-- ordernote: every list filters (orderId, isDeleted); public tracker filters (orderId, isPublic)
CREATE INDEX `ordernote_orderId_isDeleted_idx` ON `ordernote`(`orderId`, `isDeleted`);
CREATE INDEX `ordernote_orderId_isPublic_idx` ON `ordernote`(`orderId`, `isPublic`);

-- user: filtered by role and deletedAt
CREATE INDEX `user_role_idx` ON `user`(`role`);
CREATE INDEX `user_deletedAt_idx` ON `user`(`deletedAt`);

-- clientrequest: list by user, filter by status
CREATE INDEX `clientrequest_userId_deletedAt_idx` ON `clientrequest`(`userId`, `deletedAt`);
CREATE INDEX `clientrequest_status_deletedAt_idx` ON `clientrequest`(`status`, `deletedAt`);
CREATE INDEX `clientrequest_createdAt_idx` ON `clientrequest`(`createdAt`);

-- auditlog: filtered by action and sorted by createdAt
CREATE INDEX `auditlog_action_idx` ON `auditlog`(`action`);
CREATE INDEX `auditlog_createdAt_idx` ON `auditlog`(`createdAt`);

-- package: public landing page filter (isActive, sortOrder)
CREATE INDEX `package_isActive_sortOrder_idx` ON `package`(`isActive`, `sortOrder`);
CREATE INDEX `package_deletedAt_idx` ON `package`(`deletedAt`);
