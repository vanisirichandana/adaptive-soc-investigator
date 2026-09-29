CREATE POLICY "recalls deletable by authenticated" ON public.hindsight_recalls FOR DELETE TO authenticated USING (true);
GRANT DELETE ON public.hindsight_recalls TO authenticated;