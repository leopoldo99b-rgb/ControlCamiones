package com.proyecto.camiones.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.proyecto.camiones.model.Mantenimiento;



@Repository
public interface MantenimientoRepository 
        extends JpaRepository<Mantenimiento, Long>,
                JpaSpecificationExecutor<Mantenimiento> {


}