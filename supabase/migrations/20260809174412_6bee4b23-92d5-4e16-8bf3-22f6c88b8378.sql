
CREATE POLICY "media_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('avatars','thumbnails','chat-images','gifts'));

CREATE POLICY "media_own_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars','thumbnails','chat-images') AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "media_own_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars','thumbnails','chat-images') AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "media_own_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars','thumbnails','chat-images') AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "gifts_admin_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gifts' AND public.is_admin());
CREATE POLICY "gifts_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gifts' AND public.is_admin());
CREATE POLICY "gifts_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gifts' AND public.is_admin());

CREATE POLICY "proofs_own_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "proofs_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
