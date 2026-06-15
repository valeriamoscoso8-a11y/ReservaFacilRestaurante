drop database if exists reservafacil;

create database reservafacil
  character set utf8mb4
  collate utf8mb4_unicode_ci;

use reservafacil;

create table reservas (
  id int not null auto_increment,
  cliente varchar(120) not null,
  telefono varchar(30) not null,
  fecha date not null,
  hora time not null,
  personas int not null,
  mesa varchar(40) not null,
  comentarios text null,
  restaurante varchar(120) not null default 'La Terraza Gourmet',
  estado varchar(30) not null default 'confirmada',
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp on update current_timestamp,
  primary key (id),
  index idx_reservas_fecha_hora (fecha, hora),
  index idx_reservas_cliente (cliente),
  constraint chk_reservas_personas check (personas > 0)
);

insert into reservas
  (cliente, telefono, fecha, hora, personas, mesa, comentarios)
values
  ('Sofia Ortiz', '097 321 0987', '2026-06-05', '19:30:00', 2, 'Mesa 1', ''),
  ('Juan Perez', '099 123 4567', '2026-06-03', '20:30:00', 4, 'Mesa 2', ''),
  ('Laura Alvarez', '096 987 6543', '2026-06-04', '18:00:00', 3, 'Mesa 3', ''),
  ('Carlos Rodriguez', '098 456 7890', '2026-06-04', '21:00:00', 5, 'Mesa 4', ''),
  ('Maria Garcia', '098 765 4321', '2026-06-03', '19:00:00', 2, 'Mesa 5', 'Mesa cerca de la ventana'),
  ('Diego Lima', '099 654 3210', '2026-06-05', '20:00:00', 6, 'Mesa 6', '');

select * from reservas;
