package com.proyecto.camiones.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "camion_fotos")
public class CamionFoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "camion_id", nullable = false)
    private Long camionId;

    // UNIDAD o REPUESTO
    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo;

    @Column(name = "url", nullable = false, length = 500)
    private String url;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCamionId() { return camionId; }
    public void setCamionId(Long camionId) { this.camionId = camionId; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}