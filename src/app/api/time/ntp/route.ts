// GET /api/time/ntp — live NTP query (UDP dgram → pool.ntp.org, 2.5s timeout)
// Always answers 200; ok:false means the query failed (device time is used).
import { NextResponse } from "next/server";
import dgram from "node:dgram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const NTP_SERVER = "pool.ntp.org";
const NTP_PORT = 123;
const TIMEOUT_MS = 2500;
const NTP_EPOCH_OFFSET = 2208988800; // seconds between 1900 and 1970

interface NtpResult {
  ok: boolean;
  ntpMs: number;
  deviceMs: number;
  offsetMs: number;
  rttMs: number;
  server: string;
}

function failed(): NtpResult {
  return {
    ok: false,
    ntpMs: 0,
    deviceMs: Date.now(),
    offsetMs: 0,
    rttMs: 0,
    server: NTP_SERVER,
  };
}

function queryNtp(): Promise<NtpResult> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket("udp4");
    // LI=0, VN=4, Mode=3 (client) → 0b00_100_011 = 0x1b
    const packet = Buffer.alloc(48);
    packet[0] = 0x1b;

    const startedAt = Date.now();
    let settled = false;

    const finish = (result: NtpResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        /* already closed */
      }
      resolve(result);
    };

    const timer = setTimeout(() => finish(failed()), TIMEOUT_MS);

    socket.on("error", () => finish(failed()));

    socket.on("message", (msg: Buffer) => {
      const seconds = msg.readUInt32BE(40);
      const fraction = msg.readUInt32BE(44);
      const ntpMs = (seconds - NTP_EPOCH_OFFSET) * 1000 + (fraction / 4294967296) * 1000;
      const deviceMs = Date.now();
      const rttMs = deviceMs - startedAt;
      finish({
        ok: true,
        ntpMs,
        deviceMs,
        offsetMs: ntpMs + rttMs / 2 - deviceMs,
        rttMs,
        server: NTP_SERVER,
      });
    });

    socket.send(packet, NTP_PORT, NTP_SERVER, (err) => {
      if (err) finish(failed());
    });
  });
}

export async function GET() {
  const result = await queryNtp();
  return NextResponse.json(result);
}
