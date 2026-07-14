import { fireEvent, render } from "@testing-library/react-native";

import { ListRow, PrimaryButton, SectionHeader, SegmentedTabs } from "./index";

describe("common components", () => {
  it("does not call onPress when PrimaryButton is disabled", async () => {
    const onPress = jest.fn();

    const view = await render(<PrimaryButton disabled label="Save schedule" onPress={onPress} />);

    fireEvent.press(view.getByRole("button", { name: "Save schedule" }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("calls onChange with the selected segmented tab value", async () => {
    const onChange = jest.fn();

    const view = await render(
      <SegmentedTabs
        onChange={onChange}
        options={[
          { label: "AI", value: "ai" },
          { label: "Manual", value: "manual" }
        ]}
        value="ai"
      />
    );

    fireEvent.press(view.getByRole("button", { name: "Manual" }));

    expect(onChange).toHaveBeenCalledWith("manual");
  });

  it("renders a section title and optional subtitle", async () => {
    const view = await render(<SectionHeader subtitle="3 items need attention" title="Preparation" />);

    expect(view.getByText("Preparation")).toBeTruthy();
    expect(view.getByText("3 items need attention")).toBeTruthy();
  });

  it("uses a descriptive accessibility label for tappable list rows", async () => {
    const view = await render(<ListRow accessibilityLabel="Open reminder style" title="Reminder style" />);

    expect(view.getByRole("button", { name: "Open reminder style" })).toBeTruthy();
  });
});
