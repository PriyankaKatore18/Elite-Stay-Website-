
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;

DROP POLICY "Anyone can submit enquiries" ON public.enquiries;
CREATE POLICY "Anyone can submit enquiries"
  ON public.enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(phone) BETWEEN 4 AND 30
    AND (email IS NULL OR length(email) <= 320)
    AND (message IS NULL OR length(message) <= 2000)
  );
