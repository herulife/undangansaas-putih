begin;

insert into templates (name, slug, category, config_schema, tier_access, assets_url, preview_url, is_active)
values (
  'Wedding Premium 050',
  'wedding-premium050-pixel-clean',
  'Wedding',
  '{"type":"object","required":["bride","groom","eventDate","venue"],"properties":{"bride":{"type":"string"},"groom":{"type":"string"},"eventDate":{"type":"string","format":"date"},"venue":{"type":"string"},"city":{"type":"string"},"gift":{"type":"object"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
  array['creator', 'pro', 'business'],
  '/templates/wedding-premium050-pixel-clean',
  '/templates/wedding-premium050-pixel-clean/index.html',
  true
)
on conflict (slug) do update
set name = excluded.name,
    category = excluded.category,
    config_schema = excluded.config_schema,
    tier_access = excluded.tier_access,
    assets_url = excluded.assets_url,
    preview_url = excluded.preview_url,
    is_active = true,
    updated_at = now();

update invitations
set template_id = (select id from templates where slug = 'wedding-premium050-pixel-clean'),
    updated_at = now()
where template_id <> (select id from templates where slug = 'wedding-premium050-pixel-clean');

delete from templates
where slug <> 'wedding-premium050-pixel-clean';

commit;
