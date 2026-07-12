package com.proyecto.camiones.services;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.proyecto.camiones.model.Camion;
import com.proyecto.camiones.repository.CamionRepository;

@Service
public class CamionService {

	@Autowired
	private CamionRepository repo;

	@Autowired
	private CloudinaryService cloudinaryService;

	// ============================
	// GUARDAR
	// ============================

	public Camion guardar(MultipartFile foto, String placa, String marca, String modelo, Integer anio, String color,
			String tipo, Double capacidad, String motor, String chasis, Integer kilometraje, String estado,
			LocalDate fechaCompra, Double valorCompra, String observaciones) throws IOException {

		Camion c = new Camion();

		c.setPlaca(placa);
		c.setMarca(marca);
		c.setModelo(modelo);

		c.setAnio(anio);
		c.setColor(color);

		c.setTipo(tipo);
		c.setEstado(estado);

		c.setCapacidadCarga(capacidad);

		c.setNumeroMotor(motor);
		c.setNumeroChasis(chasis);

		c.setKilometrajeActual(kilometraje);

		c.setFechaCompra(fechaCompra);
		c.setValorCompra(valorCompra);

		c.setObservaciones(observaciones);

		if (foto != null && !foto.isEmpty()) {

			String url = cloudinaryService.subirImagen(foto);

			c.setImgcamion(url);

		}

		return repo.save(c);

	}

	// ============================
	// LISTAR
	// ============================

	public List<Camion> listarTodos() {

		return repo.findAll();

	}

	// ============================
	// ELIMINAR
	// ============================

	public void eliminar(Long id) throws IOException {

		Camion camion = repo.findById(id).orElseThrow(() -> new RuntimeException("Camión no encontrado"));

		if (camion.getImgcamion() != null && !camion.getImgcamion().isEmpty()) {

			cloudinaryService.eliminarImagen(camion.getImgcamion());

		}

		repo.delete(camion);

	}

	// ============================
	// EDITAR
	// ============================

	public Camion editar(Long id, MultipartFile foto, String placa, String marca, String modelo, Integer anio,
			String color, String tipo, Double capacidad, String motor, String chasis, Integer kilometraje,
			String estado, LocalDate fechaCompra, Double valorCompra, String observaciones) throws IOException {

		Camion c = repo.findById(id).orElseThrow(() -> new RuntimeException("Camión no encontrado"));

		c.setPlaca(placa);

		c.setMarca(marca);

		c.setModelo(modelo);

		c.setAnio(anio);

		c.setColor(color);

		c.setTipo(tipo);

		c.setEstado(estado);

		c.setCapacidadCarga(capacidad);

		c.setNumeroMotor(motor);

		c.setNumeroChasis(chasis);

		c.setKilometrajeActual(kilometraje);

		c.setFechaCompra(fechaCompra);

		c.setValorCompra(valorCompra);

		c.setObservaciones(observaciones);

		// Si se seleccionó una nueva foto, reemplazar la anterior
		if (foto != null && !foto.isEmpty()) {

			// Eliminar imagen anterior de Cloudinary
			if (c.getImgcamion() != null && !c.getImgcamion().isBlank()) {

				cloudinaryService.eliminarImagen(c.getImgcamion());

			}

			// Subir nueva imagen
			String url = cloudinaryService.subirImagen(foto);

			c.setImgcamion(url);

		}

		return repo.save(c);

	}
	// ============================
	// AGREGAR OBSERVACION
	// ============================

	public Camion agregarObservacion(Long id, String nueva) {


	    Camion c =
	        repo.findById(id)
	        .orElseThrow(
	            () -> new RuntimeException("Camión no encontrado")
	        );


	    String actual = c.getObservaciones();


	    if(actual == null || actual.trim().isEmpty()){


	        c.setObservaciones(
	            nueva.trim()
	        );


	    }else{


	        c.setObservaciones(

	            actual.trim()
	            +
	            "\n\n\n"
	            +
	            nueva.trim()

	        );

	    }


	    return repo.save(c);

	}
	// ============================
	// ACTUALIZAR OBSERVACIONES
	// ============================

	public Camion actualizarObservaciones(
	        Long id,
	        String observaciones) {


	    Camion c =
	        repo.findById(id)
	        .orElseThrow(
	            () -> new RuntimeException(
	                "Camión no encontrado"
	            )
	        );


	    c.setObservaciones(observaciones);


	    return repo.save(c);

	}
}