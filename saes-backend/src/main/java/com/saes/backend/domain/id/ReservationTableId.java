package com.saes.backend.domain.id;

import java.io.Serializable;
import java.util.Objects;

public class ReservationTableId implements Serializable {

    private Long reservation;
    private Long table;

    public ReservationTableId() {
    }

    public ReservationTableId(Long reservation, Long table) {
        this.reservation = reservation;
        this.table = table;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ReservationTableId that)) return false;
        return Objects.equals(reservation, that.reservation) && Objects.equals(table, that.table);
    }

    @Override
    public int hashCode() {
        return Objects.hash(reservation, table);
    }
}
