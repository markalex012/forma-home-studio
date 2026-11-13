package org.markalex.forma.tv;

import org.junit.Test;
import static org.junit.Assert.*;

public class VideoLinksTest {
    @Test public void acceptsOnlyTheStudioOriginAndPage() {
        assertTrue(VideoLinks.isStudio(VideoLinks.STUDIO + "?android=1"));
        assertTrue(VideoLinks.isStudio(VideoLinks.STUDIO + "index.html"));
        assertFalse(VideoLinks.isStudio("http://markalex012.github.io/forma-home-studio/"));
        assertFalse(VideoLinks.isStudio("https://markalex012.github.io.evil.example/forma-home-studio/"));
        assertFalse(VideoLinks.isStudio("https://markalex012.github.io/another-site/"));
        assertFalse(VideoLinks.isStudio("https://user@markalex012.github.io/forma-home-studio/"));
        assertFalse(VideoLinks.isStudio("https://markalex012.github.io:444/forma-home-studio/"));
        assertFalse(VideoLinks.isStudio(null));
    }
    @Test public void backupAcceptsOnlyBoundedBase64UrlData() {
        String json = "{\"format\":\"forma-studio\",\"version\":1}";
        String encoded = java.util.Base64.getUrlEncoder().withoutPadding()
            .encodeToString(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        assertArrayEquals(json.getBytes(java.nio.charset.StandardCharsets.UTF_8),
            VideoLinks.backup("forma://backup/" + encoded));
        assertNull(VideoLinks.backup("forma://user@backup/" + encoded));
        assertNull(VideoLinks.backup("forma://backup/" + encoded + "?redirect=bad"));
        assertNull(VideoLinks.backup("forma://backup/%2F"));
        assertNull(VideoLinks.backup("forma://backup/" + "A".repeat(340001)));
    }

    @Test public void permitsOnlyOnePlainVideoIdentifier() {
        assertEquals("v7AYKMP6rOE", VideoLinks.videoId("forma://video/v7AYKMP6rOE"));
        assertNull(VideoLinks.videoId("forma://video/short"));
        assertNull(VideoLinks.videoId("forma://video/v7AYKMP6rOE?redirect=bad"));
        assertNull(VideoLinks.videoId("forma://video/v7AYKMP6rOE#fragment"));
        assertNull(VideoLinks.videoId("forma://user@video/v7AYKMP6rOE"));
        assertNull(VideoLinks.videoId("forma://video/%767AYKMP6rOE"));
        assertNull(VideoLinks.videoId("intent://video/v7AYKMP6rOE"));
        assertNull(VideoLinks.videoId(null));
    }
}
