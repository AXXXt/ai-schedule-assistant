
import { generateReminders, getUpcomingReminders, getNextReminder, formatReminderTime } from "../reminderService";
import type { AIPlan } from "@/types/ai";
import type { UserPreference } from "@/types/preference";

const defaultPref: UserPreference = {
  mbti: "INFP", adviceStyle: "best_one", reminderStyle: "standard", planDetailLevel: "normal",
};

function makePlan(overrides: Partial<AIPlan> = {}): AIPlan {
  return {
    id: "plan-1", scheduleId: "sched-1", summary: "test", confidence: "high",
    timeline: [
      { id: "tl-1", time: "14:00", title: "prepare", type: "preparation" as const },
      { id: "tl-2", time: "14:20", title: "depart", type: "departure" as const },
      { id: "tl-3", time: "15:00", title: "event", type: "event" as const },
    ],
    checklist: [], risks: [], suggestions: [], generatedAt: "2026-07-14T09:00:00+08:00",
    ...overrides,
  };
}

const t0 = "2026-07-14T15:00:00+08:00";

describe("generateReminders", () => {
  it("standard: 2 event + 1 departure", () => {
    const r = generateReminders(makePlan(), "test", t0, defaultPref);
    expect(r.filter(x=>x.type==="event")).toHaveLength(2);
    expect(r.filter(x=>x.type==="departure")).toHaveLength(1);
    expect(r).toHaveLength(3);
  });

  it("light: 1 event + 1 departure", () => {
    const prefs = { ...defaultPref, reminderStyle: "light" as const };
    const r = generateReminders(makePlan(), "test", t0, prefs);
    expect(r.filter(x=>x.type==="event")).toHaveLength(1);
    expect(r).toHaveLength(2);
  });

  it("repeated: 3 event + 1 departure + 1 followUp", () => {
    const prefs = { ...defaultPref, reminderStyle: "repeated" as const };
    const plan = makePlan({ followUp: [{ id: "fu", title: "review" }] });
    const r = generateReminders(plan, "test", t0, prefs);
    expect(r.filter(x=>x.type==="event")).toHaveLength(3);
    expect(r.filter(x=>x.type==="departure")).toHaveLength(1);
    expect(r.filter(x=>x.type==="follow_up")).toHaveLength(1);
  });

  it("empty timeline => empty", () => {
    const r = generateReminders(makePlan({ timeline: [] }), "empty", t0, defaultPref);
    expect(r).toHaveLength(0);
  });

  it("preparation only => empty", () => {
    const plan = makePlan({ timeline: [{ id: "1", time: "14:00", title: "p", type: "preparation" as const }] });
    expect(generateReminders(plan, "p", t0, defaultPref)).toHaveLength(0);
  });

  it("all triggers before scheduleStartAt", () => {
    const r = generateReminders(makePlan(), "test", t0, defaultPref);
    for (const x of r) expect(new Date(x.triggerAt).getTime()).toBeLessThan(new Date(t0).getTime());
  });

  it("repeated without followUp => no followUp reminders", () => {
    const prefs = { ...defaultPref, reminderStyle: "repeated" as const };
    const r = generateReminders(makePlan({ followUp: undefined }), "test", t0, prefs);
    expect(r.filter(x=>x.type==="follow_up")).toHaveLength(0);
  });

  it("departure anchored to timeline departure time, not event time", () => {
    const plan = makePlan({
      timeline: [
        { id: "1", time: "21:40", title: "go", type: "departure" as const },
        { id: "2", time: "22:00", title: "arrive", type: "event" as const },
      ],
    });
    const r = generateReminders(plan, "wanda", "2026-07-14T22:00:00+08:00", defaultPref);
    const dep = r.find(x=>x.type==="departure")!;
    const t = new Date(dep.triggerAt);
    expect(t.getHours()).toBe(21);
    expect(t.getMinutes()).toBeLessThan(40);
  });

  it("light: departure fires 15min before actual departure", () => {
    const plan = makePlan({
      timeline: [
        { id: "1", time: "08:30", title: "go", type: "departure" as const },
        { id: "2", time: "09:00", title: "run", type: "event" as const },
      ],
    });
    const prefs = { ...defaultPref, reminderStyle: "light" as const };
    const dep = generateReminders(plan, "run", "2026-07-14T09:00:00+08:00", prefs).find(x=>x.type==="departure")!;
    const t = new Date(dep.triggerAt);
    expect(t.getHours()).toBe(8);
    expect(t.getMinutes()).toBe(15);
  });
});

describe("getUpcomingReminders", () => {
  it("filters future only", () => {
    const now = new Date("2026-07-14T14:00:00+08:00");
    const r = generateReminders(makePlan(), "test", t0, defaultPref);
    for (const x of getUpcomingReminders(r, now)) expect(new Date(x.triggerAt).getTime()).toBeGreaterThan(now.getTime());
  });

  it("empty when all expired", () => {
    const now = new Date("2026-07-14T16:00:00+08:00");
    expect(getUpcomingReminders(generateReminders(makePlan(), "test", t0, defaultPref), now)).toHaveLength(0);
  });
});

describe("getNextReminder", () => {
  it("returns nearest", () => {
    const now = new Date("2026-07-14T14:00:00+08:00");
    const next = getNextReminder(generateReminders(makePlan(), "test", t0, defaultPref), now);
    expect(next).not.toBeNull();
  });
  it("null when none upcoming", () => {
    const now = new Date("2026-07-14T16:00:00+08:00");
    expect(getNextReminder(generateReminders(makePlan(), "test", t0, defaultPref), now)).toBeNull();
  });
});

describe("formatReminderTime", () => {
  it("minutes", () => expect(formatReminderTime(new Date(Date.now()+5*60000).toISOString())).toMatch(/分钟后/));
  it("hours", () => expect(formatReminderTime(new Date(Date.now()+90*60000).toISOString())).toMatch(/小时/));
  it("now", () => expect(formatReminderTime(new Date(Date.now()-60000).toISOString())).toBe("现在"));
});
