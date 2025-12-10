-- Ajouter colonne pour preview des URLs
ALTER TABLE pattern_library
ADD COLUMN preview_image_url VARCHAR(500) DEFAULT NULL AFTER url;
