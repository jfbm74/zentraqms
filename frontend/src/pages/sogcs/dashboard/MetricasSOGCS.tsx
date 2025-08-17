import React from 'react';
import { sogcsMetrics } from "./data/sogcsData";

const MetricasSOGCS = () => {
    return (
        <React.Fragment>
            <div className="col-xl-12">
                <div className="card crm-widget">
                    <div className="card-body p-0">
                        <div className="row row-cols-xxl-5 row-cols-md-3 row-cols-1 g-0">
                            {(sogcsMetrics).map((metrica, index) => (
                                <div className="col" key={index}>
                                    <div className="py-4 px-3">
                                        <h5 className="text-muted text-uppercase fs-13">
                                            {metrica.label}
                                            <i className={metrica.badge + " fs-18 float-end align-middle"}></i>
                                        </h5>
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0">
                                                <i className={metrica.icon + " display-6 text-muted cfs-22"}></i>
                                            </div>
                                            <div className="flex-grow-1 ms-3">
                                                <h2 className="mb-0 cfs-22">
                                                    <span className="counter-value">
                                                        {metrica.prefix || ''}{metrica.counter}{metrica.suffix || ''}
                                                    </span>
                                                </h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default MetricasSOGCS;