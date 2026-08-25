/**
 * Strict PS3/Movian device profile (AGENTS.md §14).
 *
 * The profile is deliberately conservative and represents the real
 * decoding limits of the client: only H.264 up to 1920x1080, level 4.1,
 * 8-bit SDR video with AAC/AC3/MP3 audio (max 5.1) may direct play.
 * Everything else — HEVC, AV1, VP9, 4K, HDR, 10-bit, TrueHD, DTS-HD, ...
 * — must be transcoded by the server into the HLS profile below
 * (§13.4, §14.2). If in doubt, prefer transcoding over direct play.
 */
class DeviceProfile {
  /**
   * Build the profile object sent with POST /Items/{id}/PlaybackInfo.
   * @param {Object} options
   * @param {boolean} [options.forceTranscode] - omit direct play profiles
   *        entirely (AGENTS.md §14.4)
   * @param {number} [options.maxBitrate] - max static bitrate in bps,
   *        default 20000000 (20 Mbps)
   */
  static build(options = {}) {
    var forceTranscode = !!options.forceTranscode;
    var maxBitrate = parseInt(options.maxBitrate, 10);
    if (isNaN(maxBitrate) || maxBitrate <= 0) {
      maxBitrate = 20000000;
    }

    var profile = {
      Name: 'Movian PlayStation 3',
      Id: Core.deviceId,
      MaxStaticBitrate: maxBitrate,
      MusicStreamingTranscodingBitrate: 320000,
      TranscodingProfiles: [
        {
          Container: 'ts',
          Type: 'Video',
          VideoCodec: 'h264',
          AudioCodec: 'aac,ac3,mp3',
          Protocol: 'hls',
          Context: 'Streaming',
          MaxAudioChannels: '6',
          MinSegments: '1',
          SegmentLength: '6',
          BreakOnNonKeyFrames: true,
        },
        {
          Container: 'mp4',
          Type: 'Video',
          VideoCodec: 'h264',
          AudioCodec: 'aac,ac3,mp3',
          Protocol: 'http',
          Context: 'Streaming',
          MaxAudioChannels: '6',
        },
      ],
      CodecProfiles: [
        // Note: The Video CodecProfile entry is intentionally omitted.
        // Jellyfin 10.11.11 throws a NullReferenceException in
        // StreamBuilder.ApplyTranscodingConditions when this entry is present
        // (500 error). The VideoAudio entry below is sufficient to cap audio
        // channels at 6 (5.1) for transcoding.
        {
          Type: 'VideoAudio',
          Codec: 'aac,ac3,mp3',
          Conditions: [
            {
              Condition: 'LessThanEqual',
              Property: 'AudioChannels',
              Value: '6',
              IsRequired: false,
            },
          ],
        },
      ],
      SubtitleProfiles: [
        { Format: 'srt', Method: 'External' },
        { Format: 'subrip', Method: 'External' },
        { Format: 'ass', Method: 'External' },
        { Format: 'ssa', Method: 'External' },
        // Bitmap subtitles cannot be rendered natively; ask the server to
        // burn them into the transcoded video (§15.2).
        { Format: 'pgs', Method: 'Encode' },
        { Format: 'pgssub', Method: 'Encode' },
        { Format: 'dvbsub', Method: 'Encode' },
        { Format: 'dvdsub', Method: 'Encode' },
      ],
      ResponseProfiles: [],
    };

    // force_transcode: direct play is disabled entirely (§14.4).
    if (!forceTranscode) {
      profile.DirectPlayProfiles = [
        { Container: 'mp4,m4v,mov', Type: 'Video', VideoCodec: 'h264', AudioCodec: 'aac,ac3,mp3' },
        { Container: 'mkv', Type: 'Video', VideoCodec: 'h264', AudioCodec: 'aac,ac3,mp3' },
        { Container: 'mp3', Type: 'Audio', AudioCodec: 'mp3' },
        { Container: 'aac,m4a', Type: 'Audio', AudioCodec: 'aac' },
      ];
    }

    return profile;
  }
}

module.exports = DeviceProfile;
