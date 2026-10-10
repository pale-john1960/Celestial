package com.celestial.calendar.ntp

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

/**
 * Celestial — minimal SNTP client (UDP, port 123).
 *
 * Sends a 48-byte client packet to an NTP pool and parses the reply to obtain
 * the clock offset. Runs on [Dispatchers.IO]; 3 s socket timeout. The offset
 * is defined as ((t2 - t1) + (t3 - t4)) / 2 where t1 = client send,
 * t2 = server receive, t3 = server transmit, t4 = client receive (all NTP
 * era seconds since 1900).
 */
object NtpClient {

    private const val NTP_EPOCH_OFFSET = 2208988800L // seconds between 1900 and 1970
    private const val TIMEOUT_MS = 3000

    /**
     * Query [host] and return the offset in milliseconds
     * (positive = device clock is behind the server).
     */
    suspend fun getOffsetMillis(host: String = "pool.ntp.org"): Result<Long> =
        withContext(Dispatchers.IO) {
            runCatching {
                DatagramSocket().use { socket ->
                    socket.soTimeout = TIMEOUT_MS

                    val buffer = ByteArray(48)
                    buffer[0] = 0x1B.toByte() // LI=3 (not synced), version 3, mode 3 (client)
                    val address = InetAddress.getByName(host)
                    socket.send(DatagramPacket(buffer, buffer.size, address, 123))

                    val response = DatagramPacket(ByteArray(48), 48)
                    socket.receive(response)
                    val data = response.data
                    if (data.size < 48) error("short NTP response")

                    val t1 = readTimestamp(data, 24) // originate (client send, echoed)
                    val t2 = readTimestamp(data, 32) // receive (server)
                    val t3 = readTimestamp(data, 40) // transmit (server)
                    val t4 = System.currentTimeMillis() + NTP_EPOCH_OFFSET * 1000L

                    val offsetSec = ((t2 - t1) + (t3 - t4)) / 2.0
                    (offsetSec * 1000.0).toLong()
                }
            }
        }

    /** Read an 8-byte NTP timestamp (seconds.frac since 1900) as a Double of seconds. */
    private fun readTimestamp(data: ByteArray, offset: Int): Double {
        val seconds = ((data[offset].toLong() and 0xFF) shl 24) or
                ((data[offset + 1].toLong() and 0xFF) shl 16) or
                ((data[offset + 2].toLong() and 0xFF) shl 8) or
                (data[offset + 3].toLong() and 0xFF)
        val fraction = ((data[offset + 4].toLong() and 0xFF) shl 24) or
                ((data[offset + 5].toLong() and 0xFF) shl 16) or
                ((data[offset + 6].toLong() and 0xFF) shl 8) or
                (data[offset + 7].toLong() and 0xFF)
        val frac = if (fraction == 0L) 0.0 else fraction.toDouble() / 4294967296.0
        return seconds + frac
    }
}
