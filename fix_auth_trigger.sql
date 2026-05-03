-- 1. Função para criar Organização e Perfil automaticamente
-- CORREÇÃO: Usando raw_user_meta_data (com sublinhado) que é o padrão do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Cria a organização primeiro
  INSERT INTO public.organizations (name, niche)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    COALESCE(new.raw_user_meta_data->>'niche', 'outros')
  )
  RETURNING id INTO new_org_id;

  -- Cria o perfil do usuário vinculado à organização
  -- Nota: a coluna na tabela profiles deve ser organization_id ou org_id? 
  -- Pelo que vi no Table Editor, o nome da coluna é 'org_id'
  INSERT INTO public.profiles (id, org_id, full_name, whatsapp, role)
  VALUES (
    new.id,
    new_org_id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário'),
    new.raw_user_meta_data->>'whatsapp',
    COALESCE(new.raw_user_meta_data->>'role', 'admin')
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Garantir que o Gatilho exista
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
