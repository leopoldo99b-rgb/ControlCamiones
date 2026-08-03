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

import dto.DashboardGraficoDTO;
import dto.GraficoDTO;
import dto.MantenimientoDTO;
import dto.MantenimientoDetalleDTO;
import dto.ReporteGraficoDTO;
import dto.ReporteGraficoRequestDTO;
import dto.RepuestoDetalleDTO;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

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

//==========================================
//DATOS PARA GRÁFICOS
//==========================================

@GetMapping("/mantenimiento/graficos/datos")
@ResponseBody
public List<GraficoDTO> datosGrafico(

      @RequestParam(defaultValue = "tipos") String dataset,

      @RequestParam(required = false) String inicio,

      @RequestParam(required = false) String fin

) {

  LocalDate fechaInicio = null;
  LocalDate fechaFin = null;

  if (inicio != null && !inicio.isBlank()) {
      fechaInicio = LocalDate.parse(inicio);
  }

  if (fin != null && !fin.isBlank()) {
      fechaFin = LocalDate.parse(fin);
  }

  List<Mantenimiento> mantenimientos =
          mantenimientoRepository.findAll(

                  MantenimientoSpecification.filtrar(

                          null,
                          null,
                          null,
                          fechaInicio,
                          fechaFin

                  )

          );

  switch (dataset) {

      //==========================================
      // MANTENIMIENTOS POR TIPO
      //==========================================

      case "tipos":

          return mantenimientos.stream()

                  .collect(Collectors.groupingBy(

                          Mantenimiento::getTipo,

                          Collectors.counting()

                  ))

                  .entrySet()

                  .stream()

                  .sorted(Map.Entry.comparingByKey())

                  .map(e -> new GraficoDTO(

                          e.getKey(),

                          e.getValue()

                  ))

                  .toList();

      //==========================================
      // ESTADOS
      //==========================================

      case "estados":

          return mantenimientos.stream()

                  .collect(Collectors.groupingBy(

                          Mantenimiento::getEstado,

                          Collectors.counting()

                  ))

                  .entrySet()

                  .stream()

                  .sorted(Map.Entry.comparingByKey())

                  .map(e -> new GraficoDTO(

                          e.getKey(),

                          e.getValue()

                  ))

                  .toList();

      //==========================================
      // COSTO POR CAMIÓN
      //==========================================

      case "camiones":

          return mantenimientos.stream()

                  .filter(m -> m.getCamion() != null)

                  .collect(Collectors.groupingBy(

                          m -> m.getCamion().getPlaca(),

                          Collectors.reducing(

                                  BigDecimal.ZERO,

                                  m -> m.getCosto() == null
                                          ? BigDecimal.ZERO
                                          : m.getCosto(),

                                  BigDecimal::add

                          )

                  ))

                  .entrySet()

                  .stream()

                  .sorted(
                          Map.Entry.<String, BigDecimal>comparingByValue()
                                  .reversed()
                  )

                  .map(e -> new GraficoDTO(

                          e.getKey(),

                          e.getValue()

                  ))

                  .toList();

      //==========================================
      // COSTOS POR MES
      //==========================================

      case "costosMes":

          return mantenimientos.stream()

                  .filter(m -> m.getFecha() != null)

                  .collect(Collectors.groupingBy(

                          m -> m.getFecha().getMonthValue(),

                          Collectors.reducing(

                                  BigDecimal.ZERO,

                                  m -> m.getCosto() == null
                                          ? BigDecimal.ZERO
                                          : m.getCosto(),

                                  BigDecimal::add

                          )

                  ))

                  .entrySet()

                  .stream()

                  .sorted(Map.Entry.comparingByKey())

                  .map(e -> new GraficoDTO(

                          String.valueOf(e.getKey()),

                          e.getValue()

                  ))

                  .toList();

      //==========================================
      // PRÓXIMOS VS VENCIDOS
      //==========================================

      case "proximos":

          return mantenimientos.stream()

                  .filter(m -> m.getProximaFecha() != null)

                  .collect(Collectors.groupingBy(

                          m ->

                                  m.getProximaFecha().isBefore(LocalDate.now())

                                          ? "Vencidos"

                                          : "Próximos",

                          Collectors.counting()

                  ))

                  .entrySet()

                  .stream()

                  .sorted(Map.Entry.comparingByKey())

                  .map(e -> new GraficoDTO(

                          e.getKey(),

                          e.getValue()

                  ))

                  .toList();

      default:

          return List.of();

  }

}

//==========================================
//DASHBOARD PARA TARJETAS
//==========================================

@GetMapping("/mantenimiento/graficos/dashboard")
@ResponseBody
public DashboardGraficoDTO dashboard(

      @RequestParam(required = false) String inicio,

      @RequestParam(required = false) String fin

) {

  LocalDate fechaInicio = null;
  LocalDate fechaFin = null;

  if (inicio != null && !inicio.isBlank()) {

      fechaInicio = LocalDate.parse(inicio);

  }

  if (fin != null && !fin.isBlank()) {

      fechaFin = LocalDate.parse(fin);

  }

  List<Mantenimiento> mantenimientos =
          mantenimientoRepository.findAll(

                  MantenimientoSpecification.filtrar(

                          null,
                          null,
                          null,
                          fechaInicio,
                          fechaFin

                  )

          );

  BigDecimal costoTotal =

          mantenimientos.stream()

                  .map(m -> m.getCosto() == null
                          ? BigDecimal.ZERO
                          : m.getCosto())

                  .reduce(

                          BigDecimal.ZERO,

                          BigDecimal::add

                  );

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

  return new DashboardGraficoDTO(

          (long) mantenimientos.size(),

          costoTotal,

          proximos,

          vencidos

  );

}

//==========================================
//REPORTE PARA PDF DE GRÁFICOS
//==========================================

@GetMapping("/mantenimiento/graficos/reporte")
@ResponseBody
public ReporteGraficoDTO reporteGrafico(

     @RequestParam String dataset,

     @RequestParam(required = false) String inicio,

     @RequestParam(required = false) String fin

) {

 //------------------------------------------
 // CONVERTIR FECHAS
 //------------------------------------------

 LocalDate fechaInicio = null;
 LocalDate fechaFin = null;

 if (inicio != null && !inicio.isBlank()) {
     fechaInicio = LocalDate.parse(inicio);
 }

 if (fin != null && !fin.isBlank()) {
     fechaFin = LocalDate.parse(fin);
 }

 //------------------------------------------
 // OBTENER MANTENIMIENTOS FILTRADOS
 //------------------------------------------

 List<Mantenimiento> mantenimientos =
         mantenimientoRepository.findAll(

                 MantenimientoSpecification.filtrar(

                         null,
                         null,
                         null,
                         fechaInicio,
                         fechaFin

                 )

         );

 //------------------------------------------
 // DASHBOARD
 //------------------------------------------

 BigDecimal costoTotal =

         mantenimientos.stream()

                 .map(Mantenimiento::getCosto)

                 .filter(Objects::nonNull)

                 .reduce(

                         BigDecimal.ZERO,

                         BigDecimal::add

                 );

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

 DashboardGraficoDTO dashboard =

         new DashboardGraficoDTO(

                 (long) mantenimientos.size(),

                 costoTotal,

                 proximos,

                 vencidos

         );

 //------------------------------------------
 // DATOS DEL GRÁFICO
 //------------------------------------------

 List<GraficoDTO> datos;

 switch (dataset) {

     case "tipos":

         datos = mantenimientos.stream()

                 .collect(Collectors.groupingBy(

                         Mantenimiento::getTipo,

                         Collectors.counting()

                 ))

                 .entrySet()

                 .stream()

                 .map(e -> new GraficoDTO(

                         e.getKey(),

                         e.getValue()

                 ))

                 .toList();

         break;

     case "estados":

         datos = mantenimientos.stream()

                 .collect(Collectors.groupingBy(

                         Mantenimiento::getEstado,

                         Collectors.counting()

                 ))

                 .entrySet()

                 .stream()

                 .map(e -> new GraficoDTO(

                         e.getKey(),

                         e.getValue()

                 ))

                 .toList();

         break;

     case "camiones":

         datos = mantenimientos.stream()

                 .collect(Collectors.groupingBy(

                         m -> m.getCamion().getPlaca(),

                         Collectors.reducing(

                                 BigDecimal.ZERO,

                                 Mantenimiento::getCosto,

                                 BigDecimal::add

                         )

                 ))

                 .entrySet()

                 .stream()

                 .map(e -> new GraficoDTO(

                         e.getKey(),

                         e.getValue()

                 ))

                 .toList();

         break;

     case "costosMes":

         datos = mantenimientos.stream()

                 .collect(Collectors.groupingBy(

                         m -> m.getFecha().getMonthValue(),

                         Collectors.reducing(

                                 BigDecimal.ZERO,

                                 Mantenimiento::getCosto,

                                 BigDecimal::add

                         )

                 ))

                 .entrySet()

                 .stream()

                 .sorted(Map.Entry.comparingByKey())

                 .map(e -> new GraficoDTO(

                         String.valueOf(e.getKey()),

                         e.getValue()

                 ))

                 .toList();

         break;

     case "proximos":

         datos = mantenimientos.stream()

                 .filter(m -> m.getProximaFecha() != null)

                 .collect(Collectors.groupingBy(

                         m ->

                                 m.getProximaFecha().isBefore(LocalDate.now())

                                         ? "Vencidos"

                                         : "Próximos",

                         Collectors.counting()

                 ))

                 .entrySet()

                 .stream()

                 .map(e -> new GraficoDTO(

                         e.getKey(),

                         e.getValue()

                 ))

                 .toList();

         break;

     default:

         datos = List.of();

 }

 //------------------------------------------
 // TÍTULO DEL REPORTE
 //------------------------------------------

 String titulo = switch (dataset) {

     case "tipos" -> "Mantenimientos por tipo";

     case "costosMes" -> "Costos por mes";

     case "estados" -> "Estados del mantenimiento";

     case "camiones" -> "Costos por camión";

     case "proximos" -> "Próximos vs Vencidos";

     default -> "Reporte de Mantenimientos";

 };

 //------------------------------------------
 // DTO FINAL
 //------------------------------------------

 ReporteGraficoDTO reporte = new ReporteGraficoDTO();

 reporte.setTitulo(titulo);
 reporte.setDataset(dataset);
 reporte.setInicio(inicio);
 reporte.setFin(fin);
 reporte.setDashboard(dashboard);
 reporte.setDatos(datos);

 return reporte;

}

//==========================================
//PDF REPORTE GRÁFICO
//==========================================

@PostMapping(
     value = "/mantenimiento/graficos/pdf",
     consumes = MediaType.APPLICATION_JSON_VALUE,
     produces = MediaType.APPLICATION_PDF_VALUE
)
public ResponseEntity<byte[]> generarReporteGrafico(

     @RequestBody ReporteGraficoRequestDTO request

) {

 try {

     //------------------------------------------
     // OBTENER DATOS DEL REPORTE
     //------------------------------------------

     ReporteGraficoDTO reporte =

             reporteGrafico(

                     request.getDataset(),

                     request.getInicio(),

                     request.getFin()

             );

     //------------------------------------------
     // CONTEXTO THYMELEAF
     //------------------------------------------

     Context context = new Context();

     context.setVariable(

             "reporte",

             reporte

     );

     context.setVariable(

             "fechaImpresion",

             LocalDateTime.now().format(

                     DateTimeFormatter.ofPattern(

                             "dd/MM/yyyy HH:mm"

                     )

             )

     );

     //------------------------------------------
     // IMAGEN DEL GRÁFICO
     //------------------------------------------

     context.setVariable(

             "imagenGrafico",

             request.getImagenGrafico() == null
                     ? ""
                     : request.getImagenGrafico()

     );

     //------------------------------------------
     // GENERAR HTML
     //------------------------------------------

     String html =

             templateEngine.process(

                     "pdf/reporte-grafico",

                     context

             );

     //------------------------------------------
     // CONVERTIR HTML A PDF
     //------------------------------------------

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

     //------------------------------------------
     // DEVOLVER PDF
     //------------------------------------------

     return ResponseEntity.ok()

             .header(

                     HttpHeaders.CONTENT_DISPOSITION,

                     "inline; filename=ReporteGrafico.pdf"

             )

             .contentType(

                     MediaType.APPLICATION_PDF

             )

             .body(

                     output.toByteArray()

             );

 }

 catch (Exception e) {

     e.printStackTrace();

     throw new RuntimeException(

             "Error generando el reporte gráfico.",

             e

     );

 }

}}