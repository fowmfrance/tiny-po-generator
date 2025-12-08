-- Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "profiles_delete_own" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = id);