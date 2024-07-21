import { b } from "code-red";

export const mainHelper = ({
  renderer,
  reactive_declarations,
  reactive_store_unsubscriptions,
  literal,
}) => {
  return renderer.has_bindings
    ? b`
			let $$settled;
			let $$rendered;
			let #previous_head = $$result.head;

			do {
				$$settled = true;
				// $$result.head is mutated by the literal expression
				// need to reset it if we're looping back to prevent duplication
				$$result.head = #previous_head;

				${reactive_declarations}

				$$rendered = ${literal};
			} while (!$$settled);

			${reactive_store_unsubscriptions}

			return $$rendered;
		`
    : b`
			${reactive_declarations}

			${reactive_store_unsubscriptions}

			return ${literal};`;
};
