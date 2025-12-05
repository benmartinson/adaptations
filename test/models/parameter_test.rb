require "test_helper"

class ParameterTest < ActiveSupport::TestCase
  test "parameter belongs to task" do
    parameter = parameters(:one)
    assert_equal tasks(:basic), parameter.task
  end

  test "parameter requires name" do
    parameter = Parameter.new(task: tasks(:basic))
    assert_not parameter.valid?
    assert_includes parameter.errors[:name], "can't be blank"
  end

  test "parameter is valid with name and task" do
    parameter = Parameter.new(name: "test_param", task: tasks(:basic))
    assert parameter.valid?
  end
end

