import {ReactNode} from 'react';

type PanelProps = {
    children: ReactNode;
};

export function Panel({children}: PanelProps) {
    return (
        <section className="panel">
            {children}
        </section>
    );
}