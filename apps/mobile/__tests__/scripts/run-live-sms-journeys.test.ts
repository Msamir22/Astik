interface RunLiveSmsJourneysModule {
  buildLiveSmsActionProbeCleanupSql(): string;
  shouldSkipRunAsProbeCleanup(
    env?: Readonly<Record<string, string | undefined>>
  ): boolean;
  createKilledAppConfirmMarker(env?: Readonly<Record<string, string | undefined>>): string;
}

const liveSmsJourneys = jest.requireActual(
  "../../scripts/run-live-sms-journeys"
) as RunLiveSmsJourneysModule;

describe("run-live-sms-journeys helpers", () => {
  it("cleans action probe transactions and transfers using real table columns", () => {
    const sql = liveSmsJourneys.buildLiveSmsActionProbeCleanupSql();

    expect(sql).toContain("delete from transactions where");
    expect(sql).toContain("counterparty like '%CONFIRM ACTION MARKET%'");
    expect(sql).toContain("note like '%CONFIRM ACTION MARKET%'");
    expect(sql).toContain(
      "user_id = (select user_id from profiles where deleted = 0 order by updated_at desc limit 1)"
    );
    expect(sql).toContain("delete from transfers where");
    expect(sql).toContain("notes like '%CONFIRM ACTION MARKET%'");
    expect(sql).not.toMatch(/delete from transfers where[^;]*counterparty/);
  });

  it("skips run-as probe cleanup for release APK runs", () => {
    expect(
      liveSmsJourneys.shouldSkipRunAsProbeCleanup({
        E2E_RELEASE_BUILD: "1",
      })
    ).toBe(true);
    expect(liveSmsJourneys.shouldSkipRunAsProbeCleanup({})).toBe(false);
  });

  it("uses a per-run killed-app marker for release verification", () => {
    expect(
      liveSmsJourneys.createKilledAppConfirmMarker({
        E2E_PROBE_RUN_ID: "run-123",
      })
    ).toBe("CLOSED CONFIRM MARKET run-123");
  });
});
