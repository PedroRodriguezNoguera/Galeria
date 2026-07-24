"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "./requireAdminSession";
import { isEventTheme, type EventTheme } from "@/constants/eventThemes";

const PLANNING_PATH = "/admin/planificacion";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export interface EventScheduleInput {
  name: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  theme: EventTheme;
}

function validateEventInput({ name, eventDate, startTime, endTime, theme }: EventScheduleInput) {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) throw new Error("El nombre no puede estar vacío.");
  if (!DATE_PATTERN.test(eventDate)) throw new Error("Fecha inválida.");
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    throw new Error("Hora inválida.");
  }
  if (endTime <= startTime) throw new Error("La hora de fin debe ser posterior a la de inicio.");
  if (!isEventTheme(theme)) throw new Error("Tema no válido.");
  return { trimmedName };
}

export async function createEvent(input: EventScheduleInput) {
  await requireAdminSession();
  const { trimmedName } = validateEventInput(input);

  const supabase = createAdminClient();
  const { error } = await supabase.from("event_schedule").insert({
    name: trimmedName,
    event_date: input.eventDate,
    start_time: input.startTime,
    end_time: input.endTime,
    theme: input.theme,
  });
  if (error) throw error;

  revalidatePath(PLANNING_PATH);
}

export async function updateEvent(id: string, input: EventScheduleInput) {
  await requireAdminSession();
  const { trimmedName } = validateEventInput(input);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("event_schedule")
    .update({
      name: trimmedName,
      event_date: input.eventDate,
      start_time: input.startTime,
      end_time: input.endTime,
      theme: input.theme,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath(PLANNING_PATH);
}

export async function deleteEvent(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("event_schedule").delete().eq("id", id);
  if (error) throw error;

  revalidatePath(PLANNING_PATH);
}

export async function updateDefaultTheme(theme: EventTheme) {
  await requireAdminSession();
  if (!isEventTheme(theme)) throw new Error("Tema no válido.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("header_settings")
    .update({ default_theme: theme, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;

  revalidatePath(PLANNING_PATH);
}
