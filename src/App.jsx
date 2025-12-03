import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

// --- Tus Componentes Existentes ---
import { HeaderComponent } from './components/HeaderComponent';
import { FooterComponent } from './components/FooterComponent';
import { ListClienteComponent } from './components/ListClienteComponent';
import { ClienteComponent } from './components/ClienteComponent';
import { ListTipoProductoComponent } from './components/ListTipoProductoComponent';
import { TipoProductoComponent } from './components/TipoProductoComponent';
import { ListProductoComponent } from './components/ListProductoComponent';
import { ProductoComponent } from './components/ProductoComponent';
import { VentaComponent } from './components/VentaComponent';
import { ListVentaComponent } from './components/ListVentaComponent';
import { MesaComponent } from './components/MesaComponent';
import { ListMesaComponent } from './components/ListMesaComponent';
import { EmpleadoComponent } from './components/EmpleadoComponent';
import { ListEmpleadoComponent } from './components/ListEmpleadoComponent';
import { ReservaComponent } from './components/ReservaComponent';
import { ListReservaComponent } from './components/ListReservaComponent';

// --- Nuevas Importaciones de Componentes de Seguridad ---
// (Estos son los componentes que discutimos, asumiendo que los has creado)
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginComponent } from '/src/components/LoginComponent.jsx';
import { RegisterComponent } from './components/RegisterComponent';
import { ChangePasswordComponent } from './components/ChangePasswordComponent';

function App() {

  return (
    <BrowserRouter>
      <HeaderComponent />
      <div className="container mt-4"> {/* Añadí un container para Bootstrap */}
        <Routes>

          {/* --- RUTAS PÚBLICAS --- */}
          {/* Rutas que cualquiera puede ver (usuarios no logueados) */}
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/register" element={<RegisterComponent />} />

          {/* --- RUTAS PROTEGIDAS --- */}
          {/* Todas las rutas dentro de este <Route> especial usarán el "ProtectedRoute".
            Si el usuario no está logueado, ProtectedRoute lo redirigirá a /login.
            Si está logueado, le mostrará el componente solicitado (el "element").
          */}
          <Route element={<ProtectedRoute />}>
            
            {/* Ruta especial para forzar el cambio de contraseña temporal */}
            <Route path="/change-password" element={<ChangePasswordComponent />} />

            {/* Tu Dashboard/Home. Apunta a ListClienteComponent */}
            <Route path="/" element={<ListClienteComponent />} />

            {/* El resto de las rutas de tu aplicación */}
            <Route path='/cliente' element={<ListClienteComponent />} />
            <Route path='/cliente/crear' element={<ClienteComponent />} />
            <Route path='/cliente/edita/:id' element={<ClienteComponent />} />

            <Route path='/tipo' element={<ListTipoProductoComponent />} />
            <Route path='/tipo/crear' element={<TipoProductoComponent />} />
            <Route path='/tipo/edita/:id' element={<TipoProductoComponent />} />

            <Route path='/producto' element={<ListProductoComponent />} />
            <Route path='/producto/crear' element={<ProductoComponent />} />
            <Route path='/producto/edita/:id' element={<ProductoComponent />} />

            <Route path='/venta' element={<ListVentaComponent />} />
            <Route path='/venta/crear' element={<VentaComponent />} />
            <Route path='/venta/editar/:id' element={<VentaComponent />} />
            <Route path='/venta/detalle/:id' element={<VentaComponent />} />

            <Route path='/mesa' element={<ListMesaComponent />} />
            <Route path='/mesa/crear' element={<MesaComponent />} />
            <Route path='/mesa/editar/:id' element={<MesaComponent />} />
            <Route path='mesa/detalle/:id' element={<MesaComponent />} />

            <Route path='/empleado' element={<ListEmpleadoComponent />} />
            <Route path='/empleado/crear' element={<EmpleadoComponent />} />
            <Route path='/empleado/editar/:id' element={<EmpleadoComponent />} />
            <Route path='empleado/detalle/:id' element={<EmpleadoComponent />} />

            <Route path='/reserva' element={<ListReservaComponent />} />
            <Route path='/reserva/crear' element={<ReservaComponent />} />
            <Route path='/reserva/editar/:id' element={<ReservaComponent />} />
            <Route path='reserva/detalle/:id' element={<ReservaComponent />} />

            {/* (Puedes añadir una ruta "catch-all" 404 aquí si quieres) */}
            {/* <Route path="*" element={<NotFoundComponent />} /> */}
            
          </Route>
          
        </Routes>
      </div>
      <FooterComponent />
    </BrowserRouter>
  );
}

export default App;