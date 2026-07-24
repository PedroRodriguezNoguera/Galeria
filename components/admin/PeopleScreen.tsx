"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { AdminNav } from "./AdminNav";
import { getPublicStorageUrl } from "@/lib/media/publicUrl";
import { updatePersonName, unassignPersonMedia } from "@/lib/actions/people";
import { usePersonMediaUpload } from "@/hooks/usePersonMediaUpload";

interface PersonRow {
  device_id: string;
  name: string | null;
  assigned_media_id: string | null;
  first_seen_at: string;
  media: { id: string; thumbnail_path: string; media_type: string } | null;
}

interface PeopleScreenProps {
  people: PersonRow[];
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function PeopleScreen({ people }: PeopleScreenProps) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 lg:max-w-5xl xl:max-w-6xl">
      <AdminNav />
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Personas</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Cada dispositivo que ha entrado por el QR. Ponles nombre y súbeles una foto o vídeo
          propio: la próxima vez que ese dispositivo abra el enlace irá directo a ella. Es
          independiente de la galería — nunca aparece en la lista pública ni en moderación.
        </p>
      </div>

      {people.length === 0 ? (
        <p className="text-sm text-foreground-muted">Todavía no ha entrado nadie.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {people.map((person) => (
            <PersonCard key={person.device_id} person={person} />
          ))}
        </div>
      )}
    </main>
  );
}

function PersonCard({ person }: { person: PersonRow }) {
  const [name, setName] = useState(person.name ?? "");
  const [isPending, startTransition] = useTransition();
  const { upload, status } = usePersonMediaUpload(person.device_id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function saveName() {
    if (name.trim() === (person.name ?? "")) return;
    startTransition(() => {
      updatePersonName(person.device_id, name);
    });
  }

  function handleUnassign() {
    startTransition(() => {
      unassignPersonMedia(person.device_id);
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) upload(file);
  }

  const busy = isPending || status === "uploading";

  return (
    <GlassPanel className="flex items-center gap-3 px-3 py-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-glass-md border border-glass-border bg-glass">
        {person.media ? (
          <Image
            src={getPublicStorageUrl("media-thumbnails", person.media.thumbnail_path)}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : null}
        {status === "uploading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-scrim">
            <Spinner size={18} className="text-white" />
          </div>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={saveName}
          placeholder="Sin nombre"
          disabled={isPending}
          className="w-full rounded-glass-md border border-transparent bg-transparent px-1 py-0.5 text-[15px] font-medium text-foreground outline-none focus:border-glass-border focus:bg-glass"
        />
        <p className="truncate px-1 font-mono text-[11px] text-foreground-muted">
          {person.device_id.slice(0, 8)} · {dateFormatter.format(new Date(person.first_seen_at))}
        </p>
      </div>

      <div className="flex shrink-0 gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="glass"
          size="sm"
          className="h-8 px-3 text-xs"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          {person.assigned_media_id ? "Cambiar" : "Asignar"}
        </Button>
        {person.assigned_media_id ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            disabled={busy}
            onClick={handleUnassign}
          >
            Quitar
          </Button>
        ) : null}
      </div>
    </GlassPanel>
  );
}
