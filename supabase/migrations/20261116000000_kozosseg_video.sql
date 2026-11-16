-- Közösség: videó is feltölthető a bejegyzésekhez (MP4, MOV, WebM), fájlonként legfeljebb 50 MB.
-- Előtte futtasd a 20261115000000_kozosseg.sql-t. Újrafuttatható.
-- Megjegyzés: a Supabase projekt globális feltöltési korlátja (Storage → Settings) is legalább 50 MB legyen.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm']
where id = 'community';
