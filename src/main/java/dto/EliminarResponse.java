package dto;

/** accion: "eliminada" (borrada de la base) o "archivada" (oculta, con historial conservado). */
public record EliminarResponse(String accion, String mensaje) {
}
