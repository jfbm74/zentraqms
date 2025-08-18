import React, { useEffect, useState, useMemo, useCallback } from 'react';
import classnames from 'classnames';
import { useSOGCSConfig } from '../../../../hooks/useModuleConfig';
import LayoutWithBreadcrumb from '../../../../components/layout/LayoutWithBreadcrumb';
import SimpleTable from '../../../../components/common/SimpleTable';
import DeleteModal from '../../../../components/common/DeleteModal';
import { isEmpty } from 'lodash';

// React Hook Form - Compatible with React 19
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema de validación para sedes
const sedeSchema = z.object({
  codigo: z.string().min(1, "Ingrese el código de la sede"),
  nombre: z.string().min(1, "Ingrese el nombre de la sede"),
  direccion: z.string().min(1, "Ingrese la dirección"),
  ciudad: z.string().min(1, "Ingrese la ciudad"),
  departamento: z.string().min(1, "Seleccione el departamento"),
  telefono: z.string().min(1, "Ingrese el teléfono"),
  estado: z.string().min(1, "Seleccione el estado")
});

type SedeFormData = z.infer<typeof sedeSchema>;

// Mock data - En producción esto vendría del backend
const mockSedes = [
  {
    id: '1',
    codigo: 'SDE001',
    nombre: 'Sede Principal - Bogotá',
    direccion: 'Calle 100 #15-30',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca',
    telefono: '+57 1 234-5678',
    estado: 'Activa',
    fechaHabilitacion: '2024-01-15',
    serviciosHabilitados: 15
  },
  {
    id: '2', 
    codigo: 'SDE002',
    nombre: 'Sede Norte - Medellín',
    direccion: 'Carrera 70 #25-80',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    telefono: '+57 4 567-8901',
    estado: 'Activa',
    fechaHabilitacion: '2024-02-20',
    serviciosHabilitados: 8
  },
  {
    id: '3',
    codigo: 'SDE003',
    nombre: 'Sede Centro - Cali',
    direccion: 'Avenida 6N #28-45',
    ciudad: 'Cali',
    departamento: 'Valle del Cauca',
    telefono: '+57 2 345-6789',
    estado: 'Inactiva',
    fechaHabilitacion: '2024-03-10',
    serviciosHabilitados: 12
  }
];

const SedesPage = () => {
  document.title = "Sedes - SOGCS | ZentraQMS";
  
  const [modal, setModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("1");
  const [sedesList, setSedesList] = useState<any[]>(mockSedes);
  const [sede, setSede] = useState<any>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [deleteModalMulti, setDeleteModalMulti] = useState<boolean>(false);
  const [selectedCheckBoxDelete, setSelectedCheckBoxDelete] = useState<any>([]);
  const [isMultiDeleteButton, setIsMultiDeleteButton] = useState<boolean>(false);

  // Personalizar configuración del módulo para sedes
  const moduleConfig = useSOGCSConfig('configuracion');
  
  // Personalizar breadcrumb para sedes
  const customModuleConfig = {
    ...moduleConfig,
    breadcrumb: {
      title: 'SOGCS',
      pageTitle: 'Sedes',
      links: [
        {
          name: 'SOGCS',
          url: '/sogcs/dashboard'
        },
        {
          name: 'Configuración',
          url: '#'
        },
        {
          name: 'Sedes'
        }
      ]
    }
  };

  // Estados para filtros
  const estadoOptions = [
    { label: 'Todos', value: 'All' },
    { label: 'Activa', value: 'Activa' },
    { label: 'Inactiva', value: 'Inactiva' },
    { label: 'En proceso', value: 'En proceso' }
  ];

  const departamentoOptions = [
    { label: 'Todos', value: 'All' },
    { label: 'Cundinamarca', value: 'Cundinamarca' },
    { label: 'Antioquia', value: 'Antioquia' },
    { label: 'Valle del Cauca', value: 'Valle del Cauca' },
    { label: 'Atlántico', value: 'Atlántico' }
  ];

  // Filtrado de tabs
  const toggleTab = (tab: any, type: any) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      let filteredSedes = mockSedes;
      if (type !== "all") {
        filteredSedes = mockSedes.filter((sede: any) => sede.estado === type);
      }
      setSedesList(filteredSedes);
    }
  };

  // Modal toggle
  const toggle = useCallback(() => {
    if (modal) {
      setModal(false);
      setSede(null);
    } else {
      setModal(true);
    }
  }, [modal]);

  // Handle edit sede
  const handleSedeClick = useCallback((arg: any) => {
    const sedeData = arg;
    setSede({
      id: sedeData.id,
      codigo: sedeData.codigo,
      nombre: sedeData.nombre,
      direccion: sedeData.direccion,
      ciudad: sedeData.ciudad,
      departamento: sedeData.departamento,
      telefono: sedeData.telefono,
      estado: sedeData.estado,
      fechaHabilitacion: sedeData.fechaHabilitacion
    });

    setIsEdit(true);
    toggle();
  }, [toggle]);

  // Delete sede
  const onClickDelete = (sede: any) => {
    setSede(sede);
    setDeleteModal(true);
  };

  const handleDeleteSede = () => {
    if (sede) {
      setSedesList(sedesList.filter(s => s.id !== sede.id));
      setDeleteModal(false);
    }
  };

  // Checkbox operations
  const checkedAll = useCallback(() => {
    const checkall: any = document.getElementById("checkBoxAll");
    const ele = document.querySelectorAll(".sedeCheckBox");
    if (checkall.checked) {
      ele.forEach((ele: any) => {
        ele.checked = true;
      });
    } else {
      ele.forEach((ele: any) => {
        ele.checked = false;
      });
    }
    deleteCheckbox();
  }, []);

  const deleteCheckbox = () => {
    const ele = document.querySelectorAll(".sedeCheckBox:checked");
    ele.length > 0 ? setIsMultiDeleteButton(true) : setIsMultiDeleteButton(false);
    setSelectedCheckBoxDelete(ele);
  };

  const deleteMultiple = () => {
    const checkall: any = document.getElementById("checkBoxAll");
    const idsToDelete = Array.from(selectedCheckBoxDelete).map((elem: any) => elem.value);
    setSedesList(sedesList.filter(sede => !idsToDelete.includes(sede.id)));
    setIsMultiDeleteButton(false);
    checkall.checked = false;
  };

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue
  } = useForm<SedeFormData>({
    resolver: zodResolver(sedeSchema),
    defaultValues: {
      codigo: '',
      nombre: '',
      direccion: '',
      ciudad: '',
      departamento: '',
      telefono: '',
      estado: 'Activa'
    }
  });

  // Update form values when editing
  useEffect(() => {
    if (sede && isEdit) {
      setValue('codigo', sede.codigo || '');
      setValue('nombre', sede.nombre || '');
      setValue('direccion', sede.direccion || '');
      setValue('ciudad', sede.ciudad || '');
      setValue('departamento', sede.departamento || '');
      setValue('telefono', sede.telefono || '');
      setValue('estado', sede.estado || 'Activa');
    } else if (!isEdit) {
      reset({
        codigo: '',
        nombre: '',
        direccion: '',
        ciudad: '',
        departamento: '',
        telefono: '',
        estado: 'Activa'
      });
    }
  }, [sede, isEdit, setValue, reset]);

  // Handle form submission
  const onSubmit: SubmitHandler<SedeFormData> = (data) => {
    if (isEdit) {
      const updatedSedes = sedesList.map(s => 
        s.id === sede.id ? { ...s, ...data } : s
      );
      setSedesList(updatedSedes);
    } else {
      const newSede = {
        id: (Math.floor(Math.random() * (100 - 10)) + 10).toString(),
        ...data,
        fechaHabilitacion: new Date().toISOString().split('T')[0],
        serviciosHabilitados: 0
      };
      setSedesList([...sedesList, newSede]);
    }
    reset();
    toggle();
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        header: <input type="checkbox" id="checkBoxAll" className="form-check-input" onClick={() => checkedAll()} />,
        accessorKey: '#',
        enableSorting: false,
        cell: (value: any, row: any) => (
          <input type="checkbox" className="sedeCheckBox form-check-input" value={row.id} onChange={() => deleteCheckbox()} />
        ),
      },
      {
        header: "Código",
        accessorKey: "codigo",
        cell: (value: any) => <span className="fw-medium text-primary">{value}</span>,
      },
      {
        header: "Nombre de la Sede",
        accessorKey: "nombre",
      },
      {
        header: "Ciudad", 
        accessorKey: "ciudad",
      },
      {
        header: "Departamento",
        accessorKey: "departamento",
      },
      {
        header: "Teléfono",
        accessorKey: "telefono",
      },
      {
        header: "Servicios",
        accessorKey: "serviciosHabilitados",
        cell: (value: any) => (
          <span className="badge bg-primary-subtle text-primary">
            {value}
          </span>
        ),
      },
      {
        header: 'Estado',
        accessorKey: 'estado',
        cell: (value: any) => {
          switch (value) {
            case "Activa":
              return <span className="badge bg-success-subtle text-success">Activa</span>;
            case "Inactiva":
              return <span className="badge bg-danger-subtle text-danger">Inactiva</span>;
            case "En proceso":
              return <span className="badge bg-warning-subtle text-warning">En proceso</span>;
            default:
              return <span className="badge bg-secondary-subtle text-secondary">{value}</span>;
          }
        }
      },
      {
        header: "Acciones",
        accessorKey: "acciones",
        enableSorting: false,
        cell: (value: any, row: any) => (
          <ul className="list-inline hstack gap-2 mb-0">
            <li className="list-inline-item">
              <button
                className="btn btn-primary btn-sm btn-icon"
                onClick={() => console.log('Ver sede:', row)}
              >
                <i className="ri-eye-fill"></i>
              </button>
            </li>
            <li className="list-inline-item edit">
              <button
                className="btn btn-success btn-sm btn-icon"
                onClick={() => handleSedeClick(row)}
              >
                <i className="ri-pencil-fill"></i>
              </button>
            </li>
            <li className="list-inline-item">
              <button
                className="btn btn-danger btn-sm btn-icon"
                onClick={() => onClickDelete(row)}
              >
                <i className="ri-delete-bin-5-fill"></i>
              </button>
            </li>
          </ul>
        ),
      },
    ],
    [handleSedeClick, checkedAll]
  );

  return (
    <LayoutWithBreadcrumb moduleConfig={customModuleConfig}>
      <DeleteModal
        show={deleteModal}
        onDeleteClick={handleDeleteSede}
        onCloseClick={() => setDeleteModal(false)}
      />
      <DeleteModal
        show={deleteModalMulti}
        onDeleteClick={() => {
          deleteMultiple();
          setDeleteModalMulti(false);
        }}
        onCloseClick={() => setDeleteModalMulti(false)}
      />

      <div className="row">
        <div className="col-12">
          <div className="card" id="sedesList">
            <div className="card-header border-0">
              <div className="row align-items-center gy-3">
                <div className="col-sm">
                  <h5 className="card-title mb-0">Gestión de Sedes</h5>
                </div>
                <div className="col-sm-auto">
                  <div className="d-flex gap-1 flex-wrap">
                    <button
                      className="btn btn-success add-btn"
                      id="create-btn"
                      onClick={() => { 
                        setIsEdit(false); 
                        reset();
                        toggle(); 
                      }}
                    >
                      <i className="ri-add-line align-bottom me-1"></i>
                      Crear Sede
                    </button>
                    <button 
                      className="btn btn-info"
                      onClick={() => console.log('Importar sedes')}
                    >
                      <i className="ri-upload-cloud-line align-bottom me-1"></i>
                      Importar
                    </button>
                    {isMultiDeleteButton && (
                      <button 
                        className="btn btn-danger btn-soft-danger"
                        onClick={() => setDeleteModalMulti(true)}
                      >
                        <i className="ri-delete-bin-2-line"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body pt-0">
              <div>
                <ul className="nav nav-tabs nav-tabs-custom nav-success" role="tablist">
                  <li className="nav-item">
                    <a
                      className={classnames("nav-link", { active: activeTab === "1" })}
                      onClick={() => toggleTab("1", "all")}
                      href="#"
                    >
                      <i className="ri-building-line me-1 align-bottom"></i>
                      Todas las Sedes
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={classnames("nav-link", { active: activeTab === "2" })}
                      onClick={() => toggleTab("2", "Activa")}
                      href="#"
                    >
                      <i className="ri-checkbox-circle-line me-1 align-bottom"></i>
                      Activas
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={classnames("nav-link", { active: activeTab === "3" })}
                      onClick={() => toggleTab("3", "Inactiva")}
                      href="#"
                    >
                      <i className="ri-close-circle-line me-1 align-bottom"></i>
                      Inactivas
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className={classnames("nav-link", { active: activeTab === "4" })}
                      onClick={() => toggleTab("4", "En proceso")}
                      href="#"
                    >
                      <i className="ri-time-line me-1 align-bottom"></i>
                      En Proceso
                    </a>
                  </li>
                </ul>

                <SimpleTable
                  columns={columns}
                  data={sedesList || []}
                  isGlobalFilter={true}
                  customPageSize={8}
                  divClass="table-responsive table-card mb-1 mt-3"
                  tableClass="align-middle table-nowrap"
                  theadClass="table-light text-muted text-uppercase"
                  SearchPlaceholder='Buscar por código, nombre, ciudad o departamento...'
                />
              </div>

              {/* Modal para crear/editar sede */}
              <div className={`modal fade ${modal ? 'show' : ''}`} 
                   id="showModal" 
                   style={{ display: modal ? 'block' : 'none' }}
                   tabIndex={-1} 
                   aria-labelledby="modalLabel" 
                   aria-hidden={!modal}>
                <div className="modal-dialog modal-lg modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header bg-light p-3">
                      <h5 className="modal-title" id="modalLabel">
                        {isEdit ? "Editar Sede" : "Crear Nueva Sede"}
                      </h5>
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={toggle}
                        aria-label="Close"
                      ></button>
                    </div>
                    <form className="tablelist-form" onSubmit={handleSubmit(onSubmit)}>
                      <div className="modal-body">
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="codigo-field" className="form-label">
                                Código de la Sede <span className="text-danger">*</span>
                              </label>
                              <input
                                {...register('codigo')}
                                id="codigo-field"
                                className={`form-control ${errors.codigo ? 'is-invalid' : ''}`}
                                placeholder="Ej: SDE001"
                                type="text"
                              />
                              {errors.codigo && (
                                <div className="invalid-feedback">{errors.codigo.message}</div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="estado-field" className="form-label">
                                Estado <span className="text-danger">*</span>
                              </label>
                              <select
                                {...register('estado')}
                                className={`form-select ${errors.estado ? 'is-invalid' : ''}`}
                              >
                                {estadoOptions.slice(1).map((item, key) => (
                                  <option value={item.value} key={key}>{item.label}</option>
                                ))}
                              </select>
                              {errors.estado && (
                                <div className="invalid-feedback">{errors.estado.message}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label htmlFor="nombre-field" className="form-label">
                            Nombre de la Sede <span className="text-danger">*</span>
                          </label>
                          <input
                            {...register('nombre')}
                            id="nombre-field"
                            className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                            placeholder="Nombre completo de la sede"
                            type="text"
                          />
                          {errors.nombre && (
                            <div className="invalid-feedback">{errors.nombre.message}</div>
                          )}
                        </div>

                        <div className="mb-3">
                          <label htmlFor="direccion-field" className="form-label">
                            Dirección <span className="text-danger">*</span>
                          </label>
                          <textarea
                            {...register('direccion')}
                            id="direccion-field"
                            className={`form-control ${errors.direccion ? 'is-invalid' : ''}`}
                            placeholder="Dirección completa"
                            rows={2}
                          />
                          {errors.direccion && (
                            <div className="invalid-feedback">{errors.direccion.message}</div>
                          )}
                        </div>

                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="ciudad-field" className="form-label">
                                Ciudad <span className="text-danger">*</span>
                              </label>
                              <input
                                {...register('ciudad')}
                                id="ciudad-field"
                                className={`form-control ${errors.ciudad ? 'is-invalid' : ''}`}
                                placeholder="Ciudad"
                                type="text"
                              />
                              {errors.ciudad && (
                                <div className="invalid-feedback">{errors.ciudad.message}</div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label htmlFor="departamento-field" className="form-label">
                                Departamento <span className="text-danger">*</span>
                              </label>
                              <select
                                {...register('departamento')}
                                className={`form-select ${errors.departamento ? 'is-invalid' : ''}`}
                              >
                                <option value="">Seleccionar departamento</option>
                                {departamentoOptions.slice(1).map((item, key) => (
                                  <option value={item.value} key={key}>{item.label}</option>
                                ))}
                              </select>
                              {errors.departamento && (
                                <div className="invalid-feedback">{errors.departamento.message}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label htmlFor="telefono-field" className="form-label">
                            Teléfono <span className="text-danger">*</span>
                          </label>
                          <input
                            {...register('telefono')}
                            id="telefono-field"
                            className={`form-control ${errors.telefono ? 'is-invalid' : ''}`}
                            placeholder="+57 1 234-5678"
                            type="text"
                          />
                          {errors.telefono && (
                            <div className="invalid-feedback">{errors.telefono.message}</div>
                          )}
                        </div>
                      </div>
                      <div className="modal-footer">
                        <div className="hstack gap-2 justify-content-end">
                          <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => setModal(false)}
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit" 
                            className="btn btn-success" 
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Procesando..." : (isEdit ? "Actualizar" : "Crear Sede")}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Modal backdrop */}
              {modal && (
                <div 
                  className="modal-backdrop fade show" 
                  onClick={toggle}
                ></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutWithBreadcrumb>
  );
};

export default SedesPage;