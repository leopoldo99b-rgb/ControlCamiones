package com.proyecto.camiones.controller;

import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import com.proyecto.camiones.model.Mantenimiento;
import com.proyecto.camiones.repository.MantenimientoRepository;
import com.proyecto.camiones.repository.MantenimientoSpecification;
import com.proyecto.camiones.services.MantenimientoService;
import dto.MantenimientoDTO;
import dto.MantenimientoDetalleDTO;
import dto.RepuestoDetalleDTO;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;



@Controller
public class MantenimientosController {


    @Autowired
    private MantenimientoService mantenimientoService;


    @Autowired
    private MantenimientoRepository mantenimientoRepository;
    @Autowired
    private TemplateEngine templateEngine;



    // ==========================================
    // VISTA
    // ==========================================

    @GetMapping("/mantenimiento")
    public String mantenimientos(){

        return "mantenimiento";

    }



 // ==========================================
 // LISTAR
 // ==========================================

 @GetMapping("/mantenimiento/lista")
 @ResponseBody
 public List<MantenimientoDTO> lista(

         @RequestParam(required = false) Long camion,

         @RequestParam(required = false) String tipo,

         @RequestParam(required = false) String estado,

         @RequestParam(required = false) String fechaInicio,

         @RequestParam(required = false) String fechaFin

 ){

     LocalDate inicio = null;

     LocalDate fin = null;

     if(fechaInicio != null && !fechaInicio.isEmpty()){

         inicio =
             LocalDate.parse(fechaInicio);

     }

     if(fechaFin != null && !fechaFin.isEmpty()){

         fin =
             LocalDate.parse(fechaFin);

     }

     return mantenimientoRepository.findAll(

             MantenimientoSpecification.filtrar(
                     camion,
                     tipo,
                     estado,
                     inicio,
                     fin
             )

     )
     .stream()
     .map(m -> new MantenimientoDTO(

             m.getId(),

             m.getCamion().getPlaca(),

             m.getFecha(),

             m.getTipo(),

             m.getTaller(),

             m.getKilometraje(),

             m.getCosto(),

             m.getEstado(),

             m.getProximoMantenimiento(),

             m.getProximaFecha()

     ))
     .toList();

 }


    // ==========================================
    // GUARDAR
    // ==========================================

    @PostMapping("/mantenimiento/guardar")
    @ResponseBody
    public Mantenimiento guardar(
            @RequestBody Mantenimiento mantenimiento
    ){


        return mantenimientoService.guardar(mantenimiento);


    }





    // ==========================================
    // ELIMINAR
    // ==========================================

    @DeleteMapping("/mantenimiento/eliminar/{id}")
    @ResponseBody
    public String eliminar(
            @PathVariable Long id
    ){


        mantenimientoService.eliminar(id);


        return "Mantenimiento eliminado correctamente";


    }

    
 // ================================================
    // CARGAR DETALLES DEL MANTENIMIENTO EN EL OJO
    // =============================================
    
    @GetMapping("/mantenimiento/ver/{id}")
    @ResponseBody
    public MantenimientoDetalleDTO ver(
            @PathVariable Long id
    ){

        Mantenimiento m =
            mantenimientoRepository.findById(id)
            .orElseThrow();


        List<RepuestoDetalleDTO> repuestos =
            m.getRepuestos()
            .stream()
            .map(r ->
                new RepuestoDetalleDTO(
                    r.getNombre(),
                    r.getCantidad(),
                    r.getPrecio(),
                    r.getSubtotal()
                )
            )
            .toList();



        return new MantenimientoDetalleDTO(

            m.getId(),
            
            m.getCamion().getId(),

            m.getCamion().getPlaca(),

            m.getFecha(),

            m.getTipo(),

            m.getTaller(),

            m.getKilometraje(),

            m.getCosto(),

            m.getEstado(),

            m.getProximoMantenimiento(),

            m.getProximaFecha(),

            m.getDescripcion(),

            m.getObservaciones(),

            repuestos

        );

    }
    
    
    
 // ==========================================
 // CAMBIAR ESTADO
 // ==========================================

 @PutMapping("/mantenimiento/estado/{id}")
 @ResponseBody
 public String cambiarEstado(
         @PathVariable Long id,
         @RequestBody Mantenimiento datos
 ){

     Mantenimiento mantenimiento =
             mantenimientoRepository.findById(id)
             .orElseThrow();


     mantenimiento.setEstado(
             datos.getEstado()
     );


     mantenimientoRepository.save(
             mantenimiento
     );


     return "Estado actualizado";

 }
//==========================================
//PDF MANTENIMIENTO
//==========================================

@GetMapping("/mantenimiento/pdf/{id}")
@ResponseBody
public ResponseEntity<byte[]> generarPdf(
      @PathVariable Long id
){

  Mantenimiento m =
          mantenimientoRepository.findById(id)
          .orElseThrow();

  List<RepuestoDetalleDTO> repuestos =
          m.getRepuestos()
          .stream()
          .map(r -> new RepuestoDetalleDTO(

                  r.getNombre(),
                  r.getCantidad(),
                  r.getPrecio(),
                  r.getSubtotal()

          ))
          .toList();


  MantenimientoDetalleDTO dto =
          new MantenimientoDetalleDTO(

                  m.getId(),
                  m.getCamion().getId(),
                  m.getCamion().getPlaca(),
                  m.getFecha(),
                  m.getTipo(),
                  m.getTaller(),
                  m.getKilometraje(),
                  m.getCosto(),
                  m.getEstado(),
                  m.getProximoMantenimiento(),
                  m.getProximaFecha(),
                  m.getDescripcion(),
                  m.getObservaciones(),
                  repuestos

          );


  Context context = new Context();

  context.setVariable(
          "mantenimiento",
          dto
  );


  DateTimeFormatter formatoFecha =
          DateTimeFormatter.ofPattern("dd/MM/yyyy");

  DateTimeFormatter formatoFechaHora =
          DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");


  context.setVariable(

          "fechaMantenimiento",

          dto.getFecha() == null
                  ? ""
                  : dto.getFecha().format(formatoFecha)

  );


  context.setVariable(

          "proximaFecha",

          dto.getProximaFecha() == null
                  ? ""
                  : dto.getProximaFecha().format(formatoFecha)

  );


  context.setVariable(

          "fechaImpresion",

          LocalDateTime.now().format(formatoFechaHora)

  );


  NumberFormat moneda =
          NumberFormat.getCurrencyInstance(
                  new Locale("es", "HN")
          );


  context.setVariable(

          "costoFormateado",

          moneda.format(dto.getCosto())

  );


  BigDecimal total =

          dto.getRepuestos()

          .stream()

          .map(RepuestoDetalleDTO::getSubtotal)

          .reduce(

                  BigDecimal.ZERO,

                  BigDecimal::add

          );


  context.setVariable(

          "totalRepuestos",

          moneda.format(total)

  );


  String html =

          templateEngine.process(

                  "pdf/mantenimiento",

                  context

          );


  try{

      ByteArrayOutputStream output =
              new ByteArrayOutputStream();

      PdfRendererBuilder builder =
              new PdfRendererBuilder();

      builder.useFastMode();

      builder.withHtmlContent(
              html,
              null
      );

      builder.toStream(
              output
      );

      builder.run();

      return ResponseEntity.ok()

              .header(
                      HttpHeaders.CONTENT_DISPOSITION,
                      "inline; filename=mantenimiento.pdf"
              )

              .contentType(
                      MediaType.APPLICATION_PDF
              )

              .body(
                      output.toByteArray()
              );

  }catch(Exception e){

      throw new RuntimeException(e);

  }

}

@GetMapping("/pdf")
public ResponseEntity<byte[]> generarAuditoriaPdf(

        @RequestParam(required = false) Long camion,
        @RequestParam(required = false) String tipo,
        @RequestParam(required = false) String estado,
        @RequestParam(required = false) String fechaInicio,
        @RequestParam(required = false) String fechaFin,
        @RequestParam(required = false, defaultValue = "") String busqueda

) {

    try {

        LocalDate inicio = null;
        LocalDate fin = null;

        if (fechaInicio != null && !fechaInicio.isBlank()) {
            inicio = LocalDate.parse(fechaInicio);
        }

        if (fechaFin != null && !fechaFin.isBlank()) {
            fin = LocalDate.parse(fechaFin);
        }

        List<Mantenimiento> mantenimientos =
                mantenimientoRepository.findAll(
                        MantenimientoSpecification.filtrar(
                                camion,
                                tipo,
                                estado,
                                inicio,
                                fin
                        )
                );

        // Si además deseas aplicar el buscador por texto
        if (!busqueda.isBlank()) {

            String texto = busqueda.toLowerCase();

            mantenimientos = mantenimientos.stream()
                    .filter(m ->

                            (m.getCamion().getPlaca() != null &&
                                    m.getCamion().getPlaca().toLowerCase().contains(texto))

                                    ||

                                    (m.getTipo() != null &&
                                            m.getTipo().toLowerCase().contains(texto))

                                    ||

                                    (m.getTaller() != null &&
                                            m.getTaller().toLowerCase().contains(texto))

                                    ||

                                    (m.getDescripcion() != null &&
                                            m.getDescripcion().toLowerCase().contains(texto))

                    )
                    .toList();
        }

        NumberFormat moneda =
                NumberFormat.getCurrencyInstance(
                        new Locale("es", "HN")
                );

        BigDecimal gastoHistorico =
                mantenimientos.stream()
                        .map(Mantenimiento::getCosto)
                        .filter(c -> c != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

        long proximos =
                mantenimientos.stream()
                        .filter(m ->

                                m.getProximaFecha() != null
                                        &&
                                        !m.getProximaFecha().isBefore(LocalDate.now())
                        )
                        .count();

        long vencidos =
                mantenimientos.stream()
                        .filter(m ->

                                m.getProximaFecha() != null
                                        &&
                                        m.getProximaFecha().isBefore(LocalDate.now())
                        )
                        .count();

        Context context = new Context();

        context.setVariable(
                "fechaImpresion",
                LocalDateTime.now().format(
                        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                )
        );

        context.setVariable(
                "filtroCamion",
                camion == null ? "Todos" : camion
        );

        context.setVariable(
                "filtroTipo",
                (tipo == null || tipo.isBlank()) ? "Todos" : tipo
        );

        context.setVariable(
                "filtroEstado",
                (estado == null || estado.isBlank()) ? "Todos" : estado
        );

        context.setVariable(
                "fechaInicio",
                (fechaInicio == null || fechaInicio.isBlank()) ? "-" : fechaInicio
        );

        context.setVariable(
                "fechaFin",
                (fechaFin == null || fechaFin.isBlank()) ? "-" : fechaFin
        );

        context.setVariable(
                "busqueda",
                busqueda.isBlank() ? "-" : busqueda
        );

        context.setVariable(
                "totalMantenimientos",
                mantenimientos.size()
        );

        context.setVariable(
                "gastoHistorico",
                moneda.format(gastoHistorico)
        );

        context.setVariable(
                "proximos",
                proximos
        );

        context.setVariable(
                "vencidos",
                vencidos
        );

        context.setVariable(
                "mantenimientos",
                mantenimientos
        );

        context.setVariable(
                "totalRegistros",
                mantenimientos.size()
        );

        String html =
                templateEngine.process(
                        "pdf/auditoria-mantenimientos-pdf",
                        context
                );

        ByteArrayOutputStream output =
                new ByteArrayOutputStream();

        PdfRendererBuilder builder =
                new PdfRendererBuilder();

        builder.useFastMode();

        builder.withHtmlContent(
                html,
                null
        );

        builder.toStream(
                output
        );

        builder.run();

        HttpHeaders headers = new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_PDF
        );

        headers.setContentDispositionFormData(
                "attachment",
                "Auditoria_Mantenimientos.pdf"
        );

        return new ResponseEntity<>(
                output.toByteArray(),
                headers,
                HttpStatus.OK
        );

    } catch (Exception e) {

        throw new RuntimeException(e);

    }

}


}