package com.proyecto.camiones.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.proyecto.camiones.model.PuntoPlanta;
import com.proyecto.camiones.model.TipoPunto;
import com.proyecto.camiones.repository.PuntoPlantaRepository;

import dto.PuntoPlantaRequest;
import dto.PuntoPlantaResponse;

import java.util.List;

@Service
@Transactional
public class PuntoPlantaService {

    private final PuntoPlantaRepository repository;

    public PuntoPlantaService(PuntoPlantaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PuntoPlantaResponse> listar(TipoPunto tipo) {
        List<PuntoPlanta> puntos;

        if (tipo == null) {
            puntos = repository.findByActivoTrueOrderByNombreAsc();
        } else {
            puntos = repository.findByTipoAndActivoTrueOrderByNombreAsc(
                    tipo
            );
        }

        return puntos.stream()
                .map(PuntoPlantaResponse::desde)
                .toList();
    }

    @Transactional(readOnly = true)
    public PuntoPlantaResponse obtener(Long id) {
        return PuntoPlantaResponse.desde(buscarActivo(id));
    }

    public PuntoPlantaResponse crear(PuntoPlantaRequest request) {
        PuntoPlanta punto = new PuntoPlanta();
        copiarDatos(request, punto);

        punto.setActivo(true);

        PuntoPlanta guardado = repository.save(punto);
        return PuntoPlantaResponse.desde(guardado);
    }

    public PuntoPlantaResponse actualizar(
            Long id,
            PuntoPlantaRequest request
    ) {
        PuntoPlanta punto = buscarActivo(id);

        copiarDatos(request, punto);

        PuntoPlanta actualizado = repository.save(punto);
        return PuntoPlantaResponse.desde(actualizado);
    }

    public void desactivar(Long id) {
        PuntoPlanta punto = buscarActivo(id);

        punto.setActivo(false);
        repository.save(punto);
    }

    private PuntoPlanta buscarActivo(Long id) {
        return repository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No se encontró un punto activo con ID " + id
                ));
    }

    private void copiarDatos(
            PuntoPlantaRequest request,
            PuntoPlanta punto
    ) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "El cuerpo de la solicitud es obligatorio");
        }

        // Antes nunca se llamaba: ahora valida nombre, tipo y coordenadas.
        request.validar();

        punto.setNombre(request.getNombre());
        punto.setTipo(request.getTipo());
        punto.setLatitud(request.getLatitud());
        punto.setLongitud(request.getLongitud());
    }
}
