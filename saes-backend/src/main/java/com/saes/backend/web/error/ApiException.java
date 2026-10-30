package com.saes.backend.web.error;

import org.springframework.http.HttpStatus;

/**
 * Erreur metier portant le motif du refus, au sens du cahier des charges
 * (« Refuse si » / « le systeme refuse et donne le motif »).
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String motif) {
        super(motif);
        this.status = status;
    }

    public static ApiException conflict(String motif) {
        return new ApiException(HttpStatus.CONFLICT, motif);
    }

    public static ApiException badRequest(String motif) {
        return new ApiException(HttpStatus.BAD_REQUEST, motif);
    }

    public static ApiException notFound(String motif) {
        return new ApiException(HttpStatus.NOT_FOUND, motif);
    }

    public static ApiException forbidden(String motif) {
        return new ApiException(HttpStatus.FORBIDDEN, motif);
    }

    public HttpStatus getStatus() {
        return status;
    }
}
