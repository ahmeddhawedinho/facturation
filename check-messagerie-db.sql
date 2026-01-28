-- Script SQL pour vérifier l'état de la messagerie
-- Exécutez ce script dans votre client PostgreSQL

-- 1. Vérifier les utilisateurs
SELECT 
    id, 
    "firstName", 
    "lastName", 
    email, 
    role,
    "companyId"
FROM "User"
WHERE "isActive" = true
ORDER BY "createdAt" DESC
LIMIT 10;

-- 2. Vérifier les canaux privés
SELECT 
    id, 
    name, 
    description,
    "companyId",
    "createdAt"
FROM "ChatChannel"
ORDER BY "createdAt" DESC;

-- 3. Vérifier les membres des canaux
SELECT 
    cm.id,
    cc.name AS "channelName",
    u."firstName" || ' ' || u."lastName" AS "memberName",
    cm."joinedAt"
FROM "ChannelMember" cm
JOIN "ChatChannel" cc ON cm."channelId" = cc.id
JOIN "User" u ON cm."userId" = u.id
ORDER BY cm."joinedAt" DESC;

-- 4. Vérifier les messages récents
SELECT 
    cm.id,
    cm.content,
    u."firstName" || ' ' || u."lastName" AS "senderName",
    cm.channel AS "publicChannel",
    cc.name AS "privateChannel",
    cm."createdAt"
FROM "ChatMessage" cm
JOIN "User" u ON cm."senderId" = u.id
LEFT JOIN "ChatChannel" cc ON cm."channelId" = cc.id
ORDER BY cm."createdAt" DESC
LIMIT 20;

-- 5. Vérifier les messages avec des erreurs potentielles
-- (channelId qui n'existe pas)
SELECT 
    cm.id,
    cm."channelId",
    cm.content,
    cm."createdAt"
FROM "ChatMessage" cm
WHERE cm."channelId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM "ChatChannel" cc WHERE cc.id = cm."channelId"
  );

-- 6. Vérifier les messages avec receiverId invalide
SELECT 
    cm.id,
    cm."receiverId",
    cm.content,
    cm."createdAt"
FROM "ChatMessage" cm
WHERE cm."receiverId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM "User" u WHERE u.id = cm."receiverId"
  );

-- 7. Compter les messages par type
SELECT 
    CASE 
        WHEN channel IS NOT NULL THEN 'Public Channel (' || channel || ')'
        WHEN "channelId" IS NOT NULL THEN 'Private Channel'
        WHEN "receiverId" IS NOT NULL THEN 'Direct Message'
        ELSE 'Unknown'
    END AS "messageType",
    COUNT(*) AS "count"
FROM "ChatMessage"
GROUP BY 
    CASE 
        WHEN channel IS NOT NULL THEN 'Public Channel (' || channel || ')'
        WHEN "channelId" IS NOT NULL THEN 'Private Channel'
        WHEN "receiverId" IS NOT NULL THEN 'Direct Message'
        ELSE 'Unknown'
    END;

-- 8. Nettoyer les messages orphelins (ATTENTION: Ceci supprime des données!)
-- Décommentez seulement si vous voulez nettoyer
-- DELETE FROM "ChatMessage"
-- WHERE "channelId" IS NOT NULL
--   AND NOT EXISTS (
--       SELECT 1 FROM "ChatChannel" cc WHERE cc.id = "ChatMessage"."channelId"
--   );

-- DELETE FROM "ChatMessage"
-- WHERE "receiverId" IS NOT NULL
--   AND NOT EXISTS (
--       SELECT 1 FROM "User" u WHERE u.id = "ChatMessage"."receiverId"
--   );
