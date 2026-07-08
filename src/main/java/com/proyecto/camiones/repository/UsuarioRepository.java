package com.proyecto.camiones.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.proyecto.camiones.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Usuario findByUsuarioAndPassword(String usuario, String password);

}