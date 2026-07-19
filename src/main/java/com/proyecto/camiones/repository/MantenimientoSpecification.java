package com.proyecto.camiones.repository;


import java.time.LocalDate;

import org.springframework.data.jpa.domain.Specification;

import com.proyecto.camiones.model.Mantenimiento;



public class MantenimientoSpecification {


    public static Specification<Mantenimiento> filtrar(
            Long camion,
            String tipo,
            String estado,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ){


        return (root, query, cb) -> {


            var predicado =
                    cb.conjunction();



            if(camion != null){


                predicado =
                cb.and(
                    predicado,
                    cb.equal(
                        root.get("camion").get("id"),
                        camion
                    )
                );


            }



            if(tipo != null && !tipo.isEmpty()){


                predicado =
                cb.and(
                    predicado,
                    cb.equal(
                        root.get("tipo"),
                        tipo
                    )
                );


            }



            if(estado != null && !estado.isEmpty()){


                predicado =
                cb.and(
                    predicado,
                    cb.equal(
                        root.get("estado"),
                        estado
                    )
                );


            }



            if(fechaInicio != null){


                predicado =
                cb.and(
                    predicado,
                    cb.greaterThanOrEqualTo(
                        root.get("fecha"),
                        fechaInicio
                    )
                );


            }



            if(fechaFin != null){


                predicado =
                cb.and(
                    predicado,
                    cb.lessThanOrEqualTo(
                        root.get("fecha"),
                        fechaFin
                    )
                );


            }



            return predicado;


        };


    }


}