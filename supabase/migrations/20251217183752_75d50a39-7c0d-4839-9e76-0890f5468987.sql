-- Add DELETE policy for stores (owners can delete their own stores)
CREATE POLICY "Donos podem deletar sua própria loja" 
ON public.stores 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Add status 'inativa' to store_status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'inativa' AND enumtypid = 'store_status'::regtype) THEN
    ALTER TYPE store_status ADD VALUE 'inativa';
  END IF;
END $$;