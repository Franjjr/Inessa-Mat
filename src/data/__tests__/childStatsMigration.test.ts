/* Migrations 0004 and 0006: the dashboard aggregates leave calig: (handwriting) attempts out, like lng: ones; 0006 also
   leaves «No lo sé» out of the top errors and adds the per-subject activity and the mission progress. The SQL itself is
   run on Postgres by supabase/tests/12_actividad_y_misiones.sql (run.sh); here the files are only checked as text. */
import { describe, expect, it } from 'vitest'
import sql from '../../../supabase/migrations/0004_caligrafia_stats.sql?raw'
import sql6 from '../../../supabase/migrations/0006_actividad_todas_asignaturas.sql?raw'

describe('0004_caligrafia_stats.sql', () => {
  it('leaves the handwriting attempts out of the child_stats aggregates', () => {
    expect(sql.split("not like 'calig:%'").length - 1).toBe(2)
  })

  it('keeps the Lengua filter as well', () => {
    expect(sql.split("not like 'lng:%'").length - 1).toBe(2)
  })
})

describe('0006_actividad_todas_asignaturas.sql', () => {
  it('keeps every maths filter of child_stats and leaves «No lo sé» out of the top errors', () => {
    for (const prefix of ['lng:%', 'calig:%', 'eng:%']) expect(sql6.split(`t.skill not like '${prefix}'`).length - 1).toBeGreaterThanOrEqual(2)
    expect(sql6).toContain("t.error_type not in ('recognition', 'dont-know')")
    expect(sql6).toContain("not in ('language', 'english', 'handwriting')")
  })

  it('keeps the signature of child_stats and adds the two functions with their grants', () => {
    expect(sql6).toContain('create or replace function public.child_stats(p_child_ids uuid[], p_since timestamptz, p_errors_since timestamptz default null)')
    expect(sql6).toContain('grant execute on function public.child_activity(uuid[], timestamptz) to authenticated;')
    expect(sql6).toContain('grant execute on function public.assignment_progress(uuid) to authenticated;')
    expect(sql6.split('security invoker').length - 1).toBe(3)
    expect(sql6.split("set search_path = ''").length - 1).toBe(3)
  })
})
