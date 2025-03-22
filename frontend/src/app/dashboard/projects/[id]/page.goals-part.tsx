{/* Goals List */}
          {filteredGoals.length > 0 ? (
            <div className="space-y-4">
              {filteredGoals.map((goal) => (
                <GoalItem
                  key={goal._id}
                  goal={goal}
                  tasks={tasks}
                  onStatusChange={handleGoalStatusChange}
                  onEdit={(goal) => {
                    setEditingGoal(goal);
                    setEditGoalDialogOpen(true);
                  }}
                  onDelete={onDeleteGoal}
                  setEditDialogOpen={setEditGoalDialogOpen}
                  onLinkTask={(goalId) => handleLinkTasks(goalId, goal.name)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No goals yet</h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery 
                  ? "No goals match your search criteria." 
                  : "Create your first goal to help organize your project tasks."}
              </p>
              <Button onClick={() => setCreateGoalDialogOpen(true)}>
                <Target className="mr-2 h-4 w-4" /> New Goal
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Create Task Dialog */}
      <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your project.
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            form={newTaskForm} 
            onSubmit={onCreateTask} 
            isSubmitting={isSubmitting} 
            onCancel={() => setCreateTaskDialogOpen(false)} 
            mode="create" 
            goals={goals}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Task Dialog */}
      <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the details of your task.
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            form={editTaskForm} 
            onSubmit={onUpdateTask} 
            isSubmitting={isSubmitting} 
            onCancel={() => setEditTaskDialogOpen(false)} 
            mode="edit" 
            goals={goals}
          />
        </DialogContent>
      </Dialog>
      
      {/* Create Goal Dialog */}
      <Dialog open={createGoalDialogOpen} onOpenChange={setCreateGoalDialogOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Add a new goal to your project.
            </DialogDescription>
          </DialogHeader>
          <GoalForm 
            form={newGoalForm} 
            onSubmit={onCreateGoal} 
            isSubmitting={isSubmitting} 
            onCancel={() => setCreateGoalDialogOpen(false)} 
            mode="create" 
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Goal Dialog */}
      <Dialog open={editGoalDialogOpen} onOpenChange={setEditGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>
              Update the details of your goal.
            </DialogDescription>
          </DialogHeader>
          <GoalForm 
            form={editGoalForm} 
            onSubmit={onUpdateGoal} 
            isSubmitting={isSubmitting} 
            onCancel={() => setEditGoalDialogOpen(false)} 
            mode="edit" 
          />
        </DialogContent>
      </Dialog>
      
      {/* Link Tasks to Goal Dialog */}
      <LinkTasksToGoalDialog
        projectId={project?._id || ""}
        goalId={selectedGoalId}
        goalName={selectedGoalName}
        open={linkTasksDialogOpen}
        onOpenChange={setLinkTasksDialogOpen}
        onTasksLinked={fetchProjectData}
      />
    </div>
  )
}
