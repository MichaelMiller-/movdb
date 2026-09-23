import {ReactNode} from 'react';

type MovieTableProps = {
    children: ReactNode;
};

export const MovieTable = ({children}: MovieTableProps) => {
    return (
        <div className="table-wrap">
            <table>
                {children}
            </table>
        </div>
    );
}