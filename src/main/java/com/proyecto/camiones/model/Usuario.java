package com.proyecto.camiones.model;

import java.time.LocalDateTime;
import java.util.Set;

import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class Usuario {

    public Usuario() {

    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "imagen_perfil")
    private String imagenPerfil;

    @Column(name = "nombre")
    private String nombre;

    @Column(name = "usuario", unique = true, nullable = false)
    private String usuario;

    @Column(name = "password")
    private String password;

    @Column(name = "correo")
    private String correo;

    @Column(name = "telefono")
    private String telefono;

    @Column(name = "rol")
    private String rol;

    @Column(name = "ultima_actividad")
    private LocalDateTime ultimaActividad;

    /*
     * RELACION USUARIO - PERMISOS
     */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "usuario_permisos",
        joinColumns = @JoinColumn(name = "usuario_id"),
        inverseJoinColumns = @JoinColumn(name = "permiso_id")
    )
    private Set<Permiso> permisos;

    // =========================
    // GETTERS
    // =========================

    public Long getId() {
        return id;
    }

    public String getImagenPerfil() {
        return imagenPerfil;
    }

    public String getNombre() {
        return nombre;
    }

    public String getUsuario() {
        return usuario;
    }

    public String getPassword() {
        return password;
    }

    public String getCorreo() {
        return correo;
    }

    public String getTelefono() {
        return telefono;
    }

    public String getRol() {
        return rol;
    }

    public LocalDateTime getUltimaActividad() {
        return ultimaActividad;
    }

    public Set<Permiso> getPermisos() {
        return permisos;
    }

    // =========================
    // SETTERS
    // =========================

    public void setId(Long id) {
        this.id = id;
    }

    public void setImagenPerfil(String imagenPerfil) {
        this.imagenPerfil = imagenPerfil;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public void setUltimaActividad(LocalDateTime ultimaActividad) {
        this.ultimaActividad = ultimaActividad;
    }

    public void setPermisos(Set<Permiso> permisos) {
        this.permisos = permisos;
    }
    
    @Transient
    public boolean isEnLinea() {

        if (ultimaActividad == null) {
            return false;
        }

        return ultimaActividad.isAfter(
                LocalDateTime.now().minusMinutes(5)
        );
    }

}

