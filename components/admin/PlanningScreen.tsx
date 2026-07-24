"use client";

import { useState, useTransition } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { AdminNav } from "./AdminNav";
import { EventHeaderPreview } from "./EventHeaderPreview";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  updateDefaultTheme,
  type EventScheduleInput,
} from "@/lib/actions/eventSchedule";
import { EVENT_THEME_OPTIONS, type EventTheme } from "@/constants/eventThemes";
import type { EventScheduleRow } from "@/lib/data/eventSchedule";

interface PlanningScreenProps {
  events: EventScheduleRow[];
  defaultTheme: EventTheme;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

function themeLabel(theme: string) {
  return EVENT_THEME_OPTIONS.find((option) => option.value === theme)?.label ?? theme;
}

function formatDate(eventDate: string) {
  // event_date llega como "YYYY-MM-DD"; construir en local para no desplazar
  // de día por interpretación UTC del constructor Date con string ISO corta.
  const [year, month, day] = eventDate.split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

const EMPTY_FORM: EventScheduleInput = {
  name: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  theme: EVENT_THEME_OPTIONS[0].value,
};

export function PlanningScreen({ events, defaultTheme }: PlanningScreenProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventScheduleInput>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [defaultThemeValue, setDefaultThemeValue] = useState<EventTheme>(defaultTheme);
  const [defaultThemeError, setDefaultThemeError] = useState<string | null>(null);

  function startEdit(event: EventScheduleRow) {
    setEditingId(event.id);
    setForm({
      name: event.name,
      eventDate: event.event_date,
      startTime: event.start_time.slice(0, 5),
      endTime: event.end_time.slice(0, 5),
      theme: event.theme as EventTheme,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) {
          await updateEvent(editingId, form);
        } else {
          await createEvent(form);
        }
        setEditingId(null);
        setForm(EMPTY_FORM);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar el evento.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteEvent(id);
      if (editingId === id) cancelEdit();
    });
  }

  function handleDefaultThemeChange(theme: EventTheme) {
    const previous = defaultThemeValue;
    setDefaultThemeValue(theme);
    setDefaultThemeError(null);
    startTransition(async () => {
      try {
        await updateDefaultTheme(theme);
      } catch (err) {
        setDefaultThemeValue(previous);
        setDefaultThemeError(
          err instanceof Error ? err.message : "No se pudo guardar el tema por defecto.",
        );
      }
    });
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <AdminNav />

      <div className="mb-6">
        <h1 className="text-xl font-semibold">Planificación</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Horario de eventos de la fiesta. Cuando estemos dentro del rango de uno, ese es el tema
          seleccionado para la cabecera; fuera de rango se usa el tema por defecto.
        </p>
      </div>

      <GlassPanel className="mb-6 flex flex-wrap items-center gap-3 px-4 py-3">
        <label htmlFor="default-theme" className="text-sm font-medium text-foreground">
          Tema por defecto
        </label>
        <select
          id="default-theme"
          value={defaultThemeValue}
          onChange={(event) => handleDefaultThemeChange(event.target.value as EventTheme)}
          disabled={isPending}
          className="h-9 rounded-glass-md border border-glass-border bg-glass px-3 text-sm text-foreground outline-none"
        >
          {EVENT_THEME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {defaultThemeError ? <p className="w-full text-sm text-red-500">{defaultThemeError}</p> : null}
      </GlassPanel>

      <GlassPanel className="mb-6 px-4 py-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {editingId ? "Editar evento" : "Nuevo evento"}
          </h2>

          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Nombre (p. ej. Encierro de la mañana)"
            disabled={isPending}
            className="h-10 rounded-glass-md border border-glass-border bg-glass px-3 text-[15px] text-foreground outline-none"
          />

          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={form.eventDate}
              onChange={(event) => setForm({ ...form, eventDate: event.target.value })}
              disabled={isPending}
              className="h-10 rounded-glass-md border border-glass-border bg-glass px-3 text-sm text-foreground outline-none"
            />
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              disabled={isPending}
              className="h-10 rounded-glass-md border border-glass-border bg-glass px-3 text-sm text-foreground outline-none"
            />
            <input
              type="time"
              value={form.endTime}
              onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              disabled={isPending}
              className="h-10 rounded-glass-md border border-glass-border bg-glass px-3 text-sm text-foreground outline-none"
            />
            <select
              value={form.theme}
              onChange={(event) => setForm({ ...form, theme: event.target.value as EventTheme })}
              disabled={isPending}
              className="h-10 rounded-glass-md border border-glass-border bg-glass px-3 text-sm text-foreground outline-none"
            >
              {EVENT_THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={isPending}>
              {editingId ? "Guardar" : "Crear"}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} disabled={isPending}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </GlassPanel>

      {events.length === 0 ? (
        <p className="text-sm text-foreground-muted">Todavía no hay eventos programados.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <div key={event.id} className="flex flex-col gap-1.5">
              <EventHeaderPreview
                theme={event.theme as EventTheme}
                title={event.name}
                subtitle={`${formatDate(event.event_date)} · ${event.start_time.slice(0, 5)}–${event.end_time.slice(0, 5)} · ${themeLabel(event.theme)}`}
              />
              <div className="flex justify-end gap-1.5 px-1">
                <Button
                  variant="glass"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={isPending}
                  onClick={() => startEdit(event)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={isPending}
                  onClick={() => handleDelete(event.id)}
                >
                  Borrar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
