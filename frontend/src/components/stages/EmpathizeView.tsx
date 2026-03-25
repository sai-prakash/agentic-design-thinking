import { User, Heart, MessageCircle, Eye, AlertTriangle, Lightbulb } from 'lucide-react';
import { useInlineEdit } from '../../hooks/use-inline-edit';
import { InlineField } from '../shared/InlineField';
import { InlineList } from '../shared/InlineList';
import { InlineTagList } from '../shared/InlineTagList';
import { SaveBar } from '../shared/SaveBar';

interface EmpathizeData {
  user_needs: string[];
  pain_points: string[];
  empathy_map: {
    thinks: string[];
    feels: string[];
    says: string[];
    does: string[];
  };
  persona: {
    name: string;
    role: string;
    goals: string[];
    frustrations: string[];
  };
  research_notes?: string;
}

export function EmpathizeView({ data }: { data: EmpathizeData }) {
  const { getValue, setValue, isDirty, isEditable, save, discard, saving } = useInlineEdit('empathize');

  if (!data?.persona) return <div className="text-sm text-zinc-500">Invalid Empathize Data</div>;

  const persona = (getValue('persona') as EmpathizeData['persona']) ?? data.persona;
  const empathyMap = (getValue('empathy_map') as EmpathizeData['empathy_map']) ?? data.empathy_map;
  const userNeeds = (getValue('user_needs') as string[]) ?? data.user_needs ?? [];
  const painPoints = (getValue('pain_points') as string[]) ?? data.pain_points ?? [];
  const researchNotes = (getValue('research_notes') as string) ?? data.research_notes ?? '';

  return (
    <div className="flex flex-col gap-6 animate-slide-up-fade">
      {/* Persona Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <InlineField
              value={persona.name || 'Target User'}
              onChange={(val) => setValue('persona', { ...persona, name: val })}
              editable={isEditable}
              variant="heading"
            />
            <InlineField
              value={persona.role || 'Primary Persona'}
              onChange={(val) => setValue('persona', { ...persona, role: val })}
              editable={isEditable}
              variant="body"
              className="mt-0.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-emerald-500">
              <TargetIcon className="h-3.5 w-3.5" /> Goals
            </h4>
            <InlineTagList
              tags={persona.goals || []}
              onChange={(tags) => setValue('persona', { ...persona, goals: tags })}
              editable={isEditable}
              tagClassName="bg-zinc-800 text-zinc-300 border-zinc-700"
              placeholder="Add goal..."
            />
          </div>
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Frustrations
            </h4>
            <InlineTagList
              tags={persona.frustrations || []}
              onChange={(tags) => setValue('persona', { ...persona, frustrations: tags })}
              editable={isEditable}
              tagClassName="bg-red-950/30 text-red-300 border-red-900/50"
              placeholder="Add frustration..."
            />
          </div>
        </div>
      </div>

      {/* Empathy Map */}
      <div>
        <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">Empathy Map</h3>
        <div className="grid grid-cols-2 gap-3">
          <EmpathyQuadrant
            title="Thinks"
            icon={<Lightbulb className="h-3.5 w-3.5" />}
            items={empathyMap?.thinks || []}
            onChange={(items) => setValue('empathy_map', { ...empathyMap, thinks: items })}
            editable={isEditable}
            bg="bg-emerald-950/10" border="border-emerald-900/20" text="text-emerald-400"
            tagClassName="bg-emerald-950/30 text-emerald-300 border-emerald-900/40"
          />
          <EmpathyQuadrant
            title="Feels"
            icon={<Heart className="h-3.5 w-3.5" />}
            items={empathyMap?.feels || []}
            onChange={(items) => setValue('empathy_map', { ...empathyMap, feels: items })}
            editable={isEditable}
            bg="bg-rose-950/10" border="border-rose-900/20" text="text-rose-400"
            tagClassName="bg-rose-950/30 text-rose-300 border-rose-900/40"
          />
          <EmpathyQuadrant
            title="Says"
            icon={<MessageCircle className="h-3.5 w-3.5" />}
            items={empathyMap?.says || []}
            onChange={(items) => setValue('empathy_map', { ...empathyMap, says: items })}
            editable={isEditable}
            bg="bg-blue-950/10" border="border-blue-900/20" text="text-blue-400"
            tagClassName="bg-blue-950/30 text-blue-300 border-blue-900/40"
          />
          <EmpathyQuadrant
            title="Does"
            icon={<Eye className="h-3.5 w-3.5" />}
            items={empathyMap?.does || []}
            onChange={(items) => setValue('empathy_map', { ...empathyMap, does: items })}
            editable={isEditable}
            bg="bg-amber-950/10" border="border-amber-900/20" text="text-amber-400"
            tagClassName="bg-amber-950/30 text-amber-300 border-amber-900/40"
          />
        </div>
      </div>

      {/* Needs & Pain Points */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">Key Needs</h3>
          <InlineList
            items={userNeeds}
            onChange={(items) => setValue('user_needs', items)}
            editable={isEditable}
            placeholder="Add need..."
          />
        </div>
        <div>
          <h3 className="mb-3 font-display text-[10px] font-bold uppercase tracking-widest text-red-500">Pain Points</h3>
          <InlineList
            items={painPoints}
            onChange={(items) => setValue('pain_points', items)}
            editable={isEditable}
            itemClassName="rounded-lg border border-red-900/30 bg-red-950/10 px-3 py-2 text-sm text-zinc-300"
            placeholder="Add pain point..."
          />
        </div>
      </div>

      {/* Research Notes */}
      {(researchNotes || isEditable) && (
        <div>
          <h3 className="mb-2 font-display text-[10px] font-bold uppercase tracking-widest text-zinc-500">Research Notes</h3>
          <InlineField
            value={researchNotes}
            onChange={(val) => setValue('research_notes', val)}
            editable={isEditable}
            variant="body"
            multiline
            placeholder="Add research notes..."
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
          />
        </div>
      )}

      <SaveBar isDirty={isDirty} saving={saving} onSave={save} onDiscard={discard} />
    </div>
  );
}

function EmpathyQuadrant({
  title, icon, items, onChange, editable,
  bg, border, text, tagClassName,
}: {
  title: string; icon: React.ReactNode; items: string[];
  onChange: (items: string[]) => void; editable: boolean;
  bg: string; border: string; text: string; tagClassName: string;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-xl border ${border} ${bg} p-3`}>
      <h4 className={`flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-widest ${text}`}>
        {icon} {title}
      </h4>
      {editable ? (
        <InlineTagList
          tags={items}
          onChange={onChange}
          editable
          tagClassName={tagClassName}
          placeholder={`Add ${title.toLowerCase()}...`}
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-zinc-400 leading-snug">• {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
