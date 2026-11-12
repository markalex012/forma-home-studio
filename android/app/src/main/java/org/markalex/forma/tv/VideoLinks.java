package org.markalex.forma.tv;

import java.net.URI;
import java.net.URISyntaxException;

/** Only known FORMA pages and single, validated video IDs are routable. */
public final class VideoLinks {
    public static final String STUDIO = "https://markalex012.github.io/forma-home-studio/";
    private VideoLinks() { }

    public static boolean isStudio(String value) {
        if (value == null) return false;
        try {
            URI uri = new URI(value);
            return "https".equals(uri.getScheme())
                && "markalex012.github.io".equals(uri.getHost())
                && uri.getUserInfo() == null && uri.getPort() == -1
                && ("/forma-home-studio/".equals(uri.getPath())
                    || "/forma-home-studio/index.html".equals(uri.getPath()));
        } catch (URISyntaxException e) { return false; }
    }

    public static String videoId(String value) {
        if (value == null) return null;
        try {
            URI uri = new URI(value);
            if (!"forma".equals(uri.getScheme()) || !"video".equals(uri.getHost())
                    || uri.getUserInfo() != null || uri.getPort() != -1
                    || uri.getQuery() != null || uri.getFragment() != null) return null;
            String path = uri.getRawPath();
            if (path == null || !path.matches("/[A-Za-z0-9_-]{11}")) return null;
            return path.substring(1);
        } catch (URISyntaxException e) { return null; }
    }
}
