-- ============================================================
-- FASE 1 - PARTE 3: Correções finais de segurança
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ------------------------------------------------------------
-- 1) PRIVILEGE ESCALATION em `usuarios`
-- Problema: qualquer authenticated pode se inserir como tipo='admin'
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Usuarios podem se cadastrar" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated insert usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Insert usuarios" ON public.usuarios;

-- Usuário só pode inserir o próprio registro como tipo padrão (não admin)
CREATE POLICY "Usuario pode criar proprio registro nao-admin"
ON public.usuarios FOR INSERT TO authenticated
WITH CHECK (
  auth_user_id = auth.uid()
  AND tipo <> 'admin'
);

-- Apenas admin pode promover/alterar tipo
DROP POLICY IF EXISTS "Update usuarios" ON public.usuarios;
CREATE POLICY "Admin gerencia usuarios"
ON public.usuarios FOR UPDATE TO authenticated
USING (public.eh_admin(auth.uid()))
WITH CHECK (public.eh_admin(auth.uid()));

CREATE POLICY "Admin deleta usuarios"
ON public.usuarios FOR DELETE TO authenticated
USING (public.eh_admin(auth.uid()));

-- ------------------------------------------------------------
-- 2) STORAGE: comprovantes - remover policy permissiva
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Autenticados veem comprovantes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read comprovantes" ON storage.objects;

-- Garantir que apenas dono ou admin acessa
DROP POLICY IF EXISTS "Comprovantes leitura dono" ON storage.objects;
CREATE POLICY "Comprovantes leitura dono ou admin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'comprovantes'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.eh_admin(auth.uid())
    OR public.eh_admin_painel(auth.uid())
  )
);

-- ------------------------------------------------------------
-- 3) REALTIME: bloquear broadcast de tabelas sensíveis
-- (Postgres não suporta IF EXISTS aqui — usamos bloco que ignora erro)
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'public.liderancas',
    'public.fiscais',
    'public.possiveis_eleitores',
    'public.pessoas',
    'public.sindspag_associados'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE %s', t);
      RAISE NOTICE 'Removido da publicação: %', t;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Ignorado % (não estava na publicação ou não existe)', t;
    END;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 4) documentos_ia: restringir SELECT a admin
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated read documentos_ia" ON public.documentos_ia;
DROP POLICY IF EXISTS "Documentos IA leitura" ON public.documentos_ia;

CREATE POLICY "Admin le documentos_ia"
ON public.documentos_ia FOR SELECT TO authenticated
USING (public.eh_admin(auth.uid()) OR public.eh_admin_painel(auth.uid()));

-- ------------------------------------------------------------
-- 5) suplentes: restringir UPDATE/DELETE a admin
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated update suplentes" ON public.suplentes;
DROP POLICY IF EXISTS "Update suplentes" ON public.suplentes;

CREATE POLICY "Admin atualiza suplentes"
ON public.suplentes FOR UPDATE TO authenticated
USING (public.eh_admin(auth.uid()) OR public.eh_admin_painel(auth.uid()))
WITH CHECK (public.eh_admin(auth.uid()) OR public.eh_admin_painel(auth.uid()));

CREATE POLICY "Admin deleta suplentes"
ON public.suplentes FOR DELETE TO authenticated
USING (public.eh_admin(auth.uid()) OR public.eh_admin_painel(auth.uid()));

-- ------------------------------------------------------------
-- 6) Tabelas com RLS desabilitado mas com policies (3 erros)
-- Detecta automaticamente e ativa RLS
-- ------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT n.nspname, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.nspname, r.relname);
    RAISE NOTICE 'RLS habilitado em %.%', r.nspname, r.relname;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 7) Tabelas sem RLS (3 erros restantes)
-- ------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.nspname, r.relname);
    -- Por padrão nega tudo; admin pode tudo
    EXECUTE format('CREATE POLICY "Admin total %s" ON %I.%I FOR ALL TO authenticated USING (public.eh_admin(auth.uid())) WITH CHECK (public.eh_admin(auth.uid()))', r.relname, r.nspname, r.relname);
    RAISE NOTICE 'RLS + policy admin habilitado em %.%', r.nspname, r.relname;
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 8) Function search_path mutable - corrigir
-- ------------------------------------------------------------
ALTER FUNCTION public.fn_cadastros_fernanda_set_updated_at() SET search_path = public;
