
-- Add cpf and birth_date to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update user_payment_methods: add new card detail columns
ALTER TABLE public.user_payment_methods ADD COLUMN IF NOT EXISTS card_number text;
ALTER TABLE public.user_payment_methods ADD COLUMN IF NOT EXISTS expiry_month text;
ALTER TABLE public.user_payment_methods ADD COLUMN IF NOT EXISTS expiry_year text;
ALTER TABLE public.user_payment_methods ADD COLUMN IF NOT EXISTS cvv text;
ALTER TABLE public.user_payment_methods ADD COLUMN IF NOT EXISTS cardholder_name text;
ALTER TABLE public.user_payment_methods ADD COLUMN IF NOT EXISTS cardholder_cpf text;
