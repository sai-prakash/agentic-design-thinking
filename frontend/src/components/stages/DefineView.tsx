import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { useInlineEdit } from '../../hooks/use-inline-edit';
import { InlineField } from '../shared/InlineField';
import { InlineList } from '../shared/InlineList';
import { InlineTagList } from '../shared/InlineTagList';
import { SaveBar } from '../shared/SaveBar';

interface Hill {
  who: string;
  what: string;
  wow: string;
}

interface DefineData {
  pov_statement: string;
  hmw_questions: string[];
  hills: Hill[];
  constraints: string[];
  guardrails: string[];
  success_metrics: string[];
}

export function DefineView({ data }: { data: DefineData }) {
  const { getValue, setValue, isDirty, isEditable, save, discard, saving } = useInlineEdit('define');

  if (!data?.pov_statement) return <div className="text-sm text-zinc-500">Invalid Define Data</div>;

  const pov = (getValue('pov_statement') as string) ?? data.pov_statement;
  const hmwQuestions = (getValue('hmw_questions') as string[]) ?? data.hmw_questions ?? [];
  const hills = (getValue('hills') as Hill[]) ?? data.hills ?? [];
  const constraints = (getValue('constraints') as string[]) ?? data.constraints ?? [];
  const guardrails = (getValue('guardrails') as string[]) ?? data.guardrails ?? [];
  const successMetrics = (getValue('success_metrics') as string[]) ?? data.success_metrics ?? [];

  return (
    <div className="flex flex-col gap-8 animate-slide-up-fade">
      {/* POV Statement */}
      <section>
        <h3 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">Point of View</h3>
        <div className="border-l-4 border-indigo-500 bg-indigo-950/10 py-3 pl-4 pr-3 rounded-r-xl">
          <InlineField
            value={pov}
            onChange={(val) => setValue('pov_statement', val)}
            editable={isEditable}
            variant="blockquote"
            multiline
          />
        </div>
      </section>

      {/* How Might We */}
      <section>
        <h3 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">How Might We</h3>
        <InlineList
          items={hmwQuestions}
          onChange={(items) => setValue('hmw_questions', items)}
          editable={isEditable}
          placeholder="Add HMW question..."
        />
      </section>

      {/* Hills */}
      <section>
        <h3 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hills</h3>
        <div className="flex flex-col gap-3">
          {hills.map((hill, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col md:flex-row">
              <div className="flex-1 border-b md:border-b-0 md:border-r border-zinc-800 p-3">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Who</span>
                <InlineField
                  value={hill.who}
                  onChange={(val) => {
                    const updated = [...hills];
                    updated[i] = { ...updated[i], who: val };
                    setValue('hills', updated);
                  }}
                  editable={isEditable}
                  variant="text"
                />
              </div>
              <div className="flex-1 border-b md:border-b-0 md:border-r border-zinc-800 p-3 bg-zinc-800/20">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">What</span>
                <InlineField
                  value={hill.what}
                  onChange={(val) => {
                    const updated = [...hills];
                    updated[i] = { ...updated[i], what: val };
                    setValue('hills', updated);
                  }}
                  editable={isEditable}
                  variant="body"
                />
              </div>
              <div className="flex-1 p-3 bg-indigo-950/10">
                <span className="block text-[9px] font-bold uppercase tracking-widest text-indigo-500 mb-1">Wow</span>
                <InlineField
                  value={hill.wow}
                  onChange={(val) => {
                    const updated = [...hills];
                    updated[i] = { ...updated[i], wow: val };
                    setValue('hills', updated);
                  }}
                  editable={isEditable}
                  variant="text"
                  className="text-indigo-300"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Constraints & Guardrails + Success Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Constraints
            </h3>
            <InlineTagList
              tags={constraints}
              onChange={(tags) => setValue('constraints', tags)}
              editable={isEditable}
              tagClassName="bg-zinc-800/80 text-zinc-300 border-zinc-700"
              placeholder="Add constraint..."
            />
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-amber-500">
              <ShieldAlert className="h-3 w-3" /> Guardrails
            </h3>
            <InlineTagList
              tags={guardrails}
              onChange={(tags) => setValue('guardrails', tags)}
              editable={isEditable}
              tagClassName="bg-amber-950/30 text-amber-300 border-amber-900/50"
              placeholder="Add guardrail..."
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-emerald-500">
            <CheckCircle2 className="h-3 w-3" /> Success Metrics
          </h3>
          <InlineList
            items={successMetrics}
            onChange={(items) => setValue('success_metrics', items)}
            editable={isEditable}
            placeholder="Add metric..."
          />
        </section>
      </div>

      <SaveBar isDirty={isDirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}
