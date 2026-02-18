import React from "react";
import { Util } from "./util";
import { SXLabeledText } from "../portlets/Form/form";

const SXInstanceInfo = ({ title, infoFields, fieldsPerRow }) => {
	//console.log("[SXInstanceInfo] ", title, infoFields, fieldsPerRow);

	const rows = Util.convertArrayToRows(
		infoFields,
		infoFields.length <= fieldsPerRow ? infoFields.length : fieldsPerRow
	);
	//console.log("[SXInstanceInfo rows] ", rows);

	return (
		<div className="form-group sx-fieldset">
			<div className="sx-legend">{title}</div>
			{rows.map((row, rowIndex) => (
				<div
					key={rowIndex}
					className="autofit-float autofit-padded-no-gutters-x autofit-row"
				>
					{row.map((col, colIndex) => (
						<div
							key={colIndex}
							className="autofit-col"
						>
							<SXLabeledText
								key={colIndex}
								label={col.label}
								text={col.value}
								align="left"
								viewType="INLINE_ATTACH"
							/>
						</div>
					))}
				</div>
			))}
		</div>
	);
};

export default SXInstanceInfo;
