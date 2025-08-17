import React from 'react';
import { Link } from '../../utils/SimpleRouter';

interface BreadCrumbProps {
    title: string;
    pageTitle : string;
}

const BreadCrumb = ({ title, pageTitle } : BreadCrumbProps) => {
    return (
        <React.Fragment>
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">{title}</h4>

                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><Link to="/">Inicio</Link></li>
                                <li className="breadcrumb-item active">{title}</li>
                            </ol>
                        </div>

                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BreadCrumb;